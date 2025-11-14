"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { fetchLocation, postLocation, deleteLocation, Location, LocationsApiResponse, CreateLocationRequest, updateLocation, UpdateLocationRequest } from "@/service/locationApi"
import {
  Search, MapPin, Building2, Users, ArrowUpDown, SortAsc, SortDesc, Grid3x3, List, ChevronLeft, ChevronRight, Plus, X, Trash2
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type SortField = "name" | "capacity" | "id"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"
// Định nghĩa kiểu cho form data, giống hệt nhau
type LocationFormData = CreateLocationRequest | UpdateLocationRequest

export default function UniStaffLocationsPage() {
  const { toast } = useToast()

  // State management
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("capacity")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [capacityFilter, setCapacityFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 12

  // Modal and form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  // const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false) // <-- ĐỔI TÊN TỪ isCreating
  const [editingLocation, setEditingLocation] = useState<Location | null>(null) // <-- STATE MỚI
  const [formData, setFormData] = useState<LocationFormData>({
    name: "",
    address: "",
    capacity: 0,
  })

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch locations
  useEffect(() => {
    loadLocations()
  }, [currentPage, sortField, sortOrder])

  const loadLocations = async () => {
    try {
      setLoading(true)
      const sortParam = sortOrder === "asc" ? [sortField] : [`${sortField},desc`]
      const response = await fetchLocation({
        page: currentPage,
        size: pageSize,
        sort: sortParam
      })

      if (response && response.content) {
        setLocations(response.content)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      }
    } catch (error) {
      console.error("Error loading locations:", error)
      toast({
        title: "Error",
        description: "Failed to load locations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Capacity categorization
  const getCapacityCategory = (capacity: number): string => {
    if (capacity <= 50) return "small"
    if (capacity <= 150) return "medium"
    if (capacity <= 350) return "large"
    return "xlarge"
  }

  const getCapacityBadge = (capacity: number) => {
    const category = getCapacityCategory(capacity)

    if (category === "small") {
      return { label: "Small Space", color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700" }
    }
    if (category === "medium") {
      return { label: "Medium Space", color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700" }
    }
    if (category === "large") {
      return { label: "Large Space", color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700" }
    }
    return { label: "Extra Large", color: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700" }
  }

  // Filter and search
  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      // Search filter
      const matchesSearch =
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address.toLowerCase().includes(searchQuery.toLowerCase())

      // Capacity filter
      const matchesCapacity =
        capacityFilter === "all" ||
        getCapacityCategory(location.capacity) === capacityFilter

      return matchesSearch && matchesCapacity
    })
  }, [locations, searchQuery, capacityFilter])

  // Statistics
  const stats = useMemo(() => {
    return {
      total: totalElements,
      small: locations.filter(l => getCapacityCategory(l.capacity) === "small").length,
      medium: locations.filter(l => getCapacityCategory(l.capacity) === "medium").length,
      large: locations.filter(l => getCapacityCategory(l.capacity) === "large").length,
      xlarge: locations.filter(l => getCapacityCategory(l.capacity) === "xlarge").length,
      totalCapacity: locations.reduce((sum, l) => sum + l.capacity, 0),
      averageCapacity: locations.length > 0 ? Math.round(locations.reduce((sum, l) => sum + l.capacity, 0) / locations.length) : 0,
    }
  }, [locations, totalElements])

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
    setCurrentPage(0) // Reset to first page
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  /**
     * (MỚI) Xử lý khi nhấn nút "Create Location" (mở modal ở chế độ tạo)
     */
  const handleOpenCreateModal = () => {
    setEditingLocation(null) // Đảm bảo không ở chế độ edit
    setFormData({ // Reset form
      name: "",
      address: "",
      capacity: 0,
    })
    setIsModalOpen(true)
  }

  /**
   * (MỚI) Xử lý khi nhấn vào Card (mở modal ở chế độ sửa)
   */
  const handleEditClick = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address,
      capacity: location.capacity,
    })
    setIsModalOpen(true)
  }

  /**
   * (MỚI) Xử lý khi đóng/mở modal
   */
  const handleModalOpenChange = (isOpen: boolean) => {
    setIsModalOpen(isOpen)
    if (!isOpen) {
      // Reset state khi modal đóng
      setEditingLocation(null)
      setFormData({ name: "", address: "", capacity: 0 })
    }
  }

  const handleFormChange = (field: keyof LocationFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  /**
   * (MỚI) Hàm Submit chính, kiểm tra validation và gọi create hoặc update
   */
  const handleFormSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({ title: "Validation Error", description: "Location name is required", variant: "destructive" })
      return
    }
    if (!formData.address.trim()) {
      toast({ title: "Validation Error", description: "Address is required", variant: "destructive" })
      return
    }
    if (formData.capacity <= 0) {
      toast({ title: "Validation Error", description: "Capacity must be greater than 0", variant: "destructive" })
      return
    }

    // Quyết định gọi hàm create hay update
    if (editingLocation) {
      await handleUpdateLocation()
    } else {
      await handleCreateLocation()
    }
  }


  // const handleCreateLocation = async () => {
  //   // Validation
  //   if (!formData.name.trim()) {
  //     toast({
  //       title: "Validation Error",
  //       description: "Location name is required",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   if (!formData.address.trim()) {
  //     toast({
  //       title: "Validation Error",
  //       description: "Address is required",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   if (formData.capacity <= 0) {
  //     toast({
  //       title: "Validation Error",
  //       description: "Capacity must be greater than 0",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   try {
  //     setIsCreating(true)
  //     await postLocation(formData)

  //     // Success
  //     toast({
  //       title: "Success",
  //       description: "Location created successfully",
  //     })

  //     // Reset form
  //     setFormData({
  //       name: "",
  //       address: "",
  //       capacity: 0,
  //     })

  //     // Close modal
  //     setIsModalOpen(false)

  //     // Reload locations
  //     loadLocations()
  //   } catch (error) {
  //     console.error("Error creating location:", error)
  //     toast({
  //       title: "Error",
  //       description: "Failed to create location. Please try again.",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setIsCreating(false)
  //   }
  // }
  /**
     * (CẬP NHẬT) Chỉ chứa logic Create
     */
  const handleCreateLocation = async () => {
    try {
      setIsSaving(true)
      await postLocation(formData as CreateLocationRequest)

      toast({
        title: "Success",
        description: "Location created successfully",
      })
      handleModalOpenChange(false) // Đóng và reset modal
      loadLocations() // Tải lại danh sách
    } catch (error) {
      console.error("Error creating location:", error)
      toast({
        title: "Error",
        description: "Failed to create location. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * (MỚI) Logic Update
   */
  const handleUpdateLocation = async () => {
    if (!editingLocation) return

    try {
      setIsSaving(true)
      await updateLocation(editingLocation.id, formData as UpdateLocationRequest)

      toast({
        title: "Success",
        description: `Location "${editingLocation.name}" updated successfully`,
      })
      handleModalOpenChange(false) // Đóng và reset modal
      loadLocations() // Tải lại danh sách
    } catch (error) {
      console.error("Error updating location:", error)
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // const handleFormChange = (field: keyof CreateLocationRequest, value: string | number) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     [field]: value
  //   }))
  // }

  const handleDeleteClick = (location: Location, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click event
    setLocationToDelete(location)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return

    try {
      setIsDeleting(true)
      await deleteLocation(locationToDelete.id)

      // Success
      toast({
        title: "Success",
        description: `Location "${locationToDelete.name}" has been deleted successfully`,
      })

      // Close dialog
      setDeleteDialogOpen(false)
      setLocationToDelete(null)

      // Reload locations
      loadLocations()
    } catch (error) {
      console.error("Error deleting location:", error)
      toast({
        title: "Error",
        description: "Failed to delete location. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setLocationToDelete(null)
  }

  return (
    <ProtectedRoute allowedRoles={["uni_staff"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                <span className="truncate">Location Management</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
                Browse and manage event locations across the campus
              </p>
            </div>

            {/* Create Location Button */}
            <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto flex-shrink-0" onClick={handleOpenCreateModal}>
                  <Plus className="h-4 w-4" />
                  <span className="truncate">Create Location</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  {/* (THAY ĐỔI) Title và Description động */}
                  <DialogTitle>
                    {editingLocation ? "Edit Location" : "Create New Location"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingLocation
                      ? `Update the details for "${editingLocation.name}"`
                      : "Add a new event location to the campus venues"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Location Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Innovation Lab A3-201"
                      value={formData.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      className="border-slate-300"
                    />
                  </div>

                  {/* Address Input */}
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      placeholder="e.g., Building A3, Technical Area, FPT University"
                      value={formData.address}
                      onChange={(e) => handleFormChange("address", e.target.value)}
                      className="border-slate-300"
                    />
                  </div>

                  {/* Capacity Input */}
                  <div className="space-y-2">
                    <Label htmlFor="capacity">
                      Capacity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      placeholder="e.g., 40"
                      value={formData.capacity || ""}
                      onChange={(e) => handleFormChange("capacity", parseInt(e.target.value) || 0)}
                      className="border-slate-300"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of people this location can accommodate
                    </p>
                  </div>
                </div>

                {/* (THAY ĐỔI) Cập nhật Dialog Footer */}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleModalOpenChange(false)} // Dùng handler mới
                    disabled={isSaving} // Dùng isSaving
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFormSubmit} // Dùng handler submit chung
                    disabled={isSaving} // Dùng isSaving
                  >
                    {/* Text động */}
                    {isSaving
                      ? (editingLocation ? "Saving..." : "Creating...")
                      : (editingLocation ? "Save Changes" : "Create Location")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-blue-700 dark:text-blue-300 font-medium truncate">Total Locations</CardDescription>
                <CardTitle className="text-3xl sm:text-4xl text-blue-900 dark:text-blue-100 truncate">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                  Available venues
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <CardDescription className="text-purple-700 dark:text-purple-300 font-medium truncate">Total Capacity</CardDescription>
                <CardTitle className="text-3xl sm:text-4xl text-purple-900 dark:text-purple-100 truncate">{stats.totalCapacity.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium truncate">
                  Combined seat capacity
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
                      placeholder="Search by name or address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {/* Capacity Filter */}
                  <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="All Sizes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      <SelectItem value="small">Small (≤50)</SelectItem>
                      <SelectItem value="medium">Medium (≤150)</SelectItem>
                      <SelectItem value="large">Large (≤350)</SelectItem>
                      <SelectItem value="xlarge">XL (&gt;350)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort Dropdown */}
                  <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split('-') as [SortField, SortOrder]
                    setSortField(field)
                    setSortOrder(order)
                    setCurrentPage(0)
                  }}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <ArrowUpDown className="h-4 w-4 mr-2 flex-shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="capacity-desc">Capacity (High)</SelectItem>
                      <SelectItem value="capacity-asc">Capacity (Low)</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="id-asc">ID (Oldest)</SelectItem>
                      <SelectItem value="id-desc">ID (Newest)</SelectItem>
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
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredLocations.length === 0 && (
            <Card className="dark:border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No locations found</h3>
                <p className="text-muted-foreground text-center">
                  {searchQuery || capacityFilter !== "all"
                    ? "Try adjusting your filters or search query"
                    : "No locations are available at the moment"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Grid View */}
          {!loading && filteredLocations.length > 0 && viewMode === "grid" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLocations.map((location) => {
                const badge = getCapacityBadge(location.capacity)
                return (
                  <Card
                    key={location.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer group relative dark:border-slate-700"
                    onClick={() => handleEditClick(location)} // mới
                  >
                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400"
                      onClick={(e) => handleDeleteClick(location, e)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 pr-8">
                        <CardTitle className="text-base sm:text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors min-w-0">
                          {location.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs"
                        >
                          #{location.id}
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
                      {/* Address */}
                      <div className="flex items-start gap-2 text-sm min-w-0">
                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-muted-foreground line-clamp-2 min-w-0">
                          {location.address}
                        </p>
                      </div>

                      {/* Capacity */}
                      <div className="flex items-center justify-between pt-2 border-t dark:border-slate-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">Capacity</span>
                        </div>
                        <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                          {location.capacity}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* List View */}
          {!loading && filteredLocations.length > 0 && viewMode === "list" && (
            <div className="space-y-3">
              {filteredLocations.map((location) => {
                const badge = getCapacityBadge(location.capacity)
                return (
                  <Card
                    key={location.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group relative dark:border-slate-700"
                    onClick={() => handleEditClick(location)}
                  >
                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400"
                      onClick={(e) => handleDeleteClick(location, e)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <CardContent className="p-4 pr-12">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left Side - Info */}
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate min-w-0">
                              {location.name}
                            </h3>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              #{location.id}
                            </Badge>
                            <Badge variant="outline" className={`${badge.color} text-xs truncate max-w-[120px]`}>
                              {badge.label}
                            </Badge>
                          </div>
                          <div className="flex items-start gap-2 text-sm min-w-0">
                            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-muted-foreground line-clamp-2 min-w-0">
                              {location.address}
                            </p>
                          </div>
                        </div>

                        {/* Right Side - Capacity */}
                        <div className="flex items-center gap-2 shrink-0 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-4 py-3 rounded-lg">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground truncate">Capacity</div>
                            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {location.capacity}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredLocations.length > 0 && totalPages > 1 && (
            <Card className="dark:border-slate-700">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                    Showing <span className="font-medium">{currentPage * pageSize + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min((currentPage + 1) * pageSize, totalElements)}
                    </span>{" "}
                    of <span className="font-medium">{totalElements}</span> locations
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="text-xs sm:text-sm"
                    >
                      <ChevronLeft className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          i === 0 ||
                          i === totalPages - 1 ||
                          (i >= currentPage - 1 && i <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(i)}
                              className="w-8 sm:w-9 text-xs sm:text-sm"
                            >
                              {i + 1}
                            </Button>
                          )
                        } else if (i === currentPage - 2 || i === currentPage + 2) {
                          return (
                            <span key={i} className="px-1 sm:px-2 text-muted-foreground text-xs">
                              ...
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages - 1}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4 sm:ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Delete Location
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this location? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              {locationToDelete && (
                <div className="py-4">
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-base sm:text-lg truncate">{locationToDelete.name}</span>
                        <Badge variant="outline" className="flex-shrink-0">#{locationToDelete.id}</Badge>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground min-w-0">
                        <Building2 className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="line-clamp-2 min-w-0">{locationToDelete.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="font-medium truncate">Capacity: {locationToDelete.capacity}</span>
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
                      Delete Location
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
