"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Gift, Package, Calendar, Clock, CheckCircle, XCircle, Plus, ChevronLeft, ChevronRight, Loader2, } from "lucide-react"
// --- Service ---
import { addProduct, Product, AddProductPayload, ProductTag, } from "@/service/productApi"
import { getClubIdFromToken } from "@/service/clubApi"
// --- Hooks ---
import { usePagination } from "@/hooks/use-pagination"
import { useToast } from "@/hooks/use-toast" // Đảm bảo import useToast đúng cách
import { useProductsByClubId, useProductTagsByClubId, queryKeys, } from "@/hooks/use-query-hooks"
// --- Components ---
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProductFilters, FilterState, SortState } from "@/components/product-filters"
import { Separator } from "@/components/ui/separator"

// ---- Compact status badge overlay (Không thay đổi) ----
const StatusBadge = ({ status }: { status: string }) => {
  const base = "truncate max-w-[7.5rem] text-xs px-2 py-1 rounded-md absolute right-2 top-2 z-10"
  if (status === "coming_soon")
    return (
      <Badge variant="outline" className={`${base} text-blue-600 border-blue-600`}>
        <Clock className="h-3 w-3 mr-1" />
        Coming Soon
      </Badge>
    )
  if (status === "now")
    return (
      <Badge variant="outline" className={`${base} text-green-600 border-green-600`}>
        <CheckCircle className="h-3 w-3 mr-1" />
        Now
      </Badge>
    )
  if (status === "finish")
    return (
      <Badge variant="outline" className={`${base} text-red-600 border-red-600`}>
        <XCircle className="h-3 w-3 mr-1" />
        Finished
      </Badge>
    )
  return null
}

// --- Minimal Pager (Không thay đổi) ---
const MinimalPager = ({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
}) =>
  total > 1 ? (
    <div className="flex items-center justify-center gap-3 mt-4">
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev} disabled={current === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[2rem] text-center text-sm font-medium">{current}</div>
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onNext} disabled={current === total}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  ) : null

// --- Trạng thái ban đầu cho form AddProductPayload ---
const initialFormState: AddProductPayload = {
  name: "",
  description: "",
  price: 0,
  stockQuantity: 0,
  productType: "CLUB_ITEM", // Giá trị mặc định
  tagIds: [],
  eventId: undefined,
}

export default function ClubLeaderGiftPage() {
  const [clubId, setClubId] = useState<number | null>(() => getClubIdFromToken())
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AddProductPayload>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const [filters, setFilters] = useState<FilterState | null>(null)
  const [sortBy, setSortBy] = useState<SortState>("popular")
  const queryClient = useQueryClient() // 4. THÊM queryClient

  // THAY THẾ useEffect/useState BẰNG REACT QUERY
  const { data: products = [], isLoading: productsLoading } = useProductsByClubId(
    clubId as number,
    !!clubId // Chỉ fetch khi clubId tồn tại
  )
  const { data: productTags = [], isLoading: tagsLoading } = useProductTagsByClubId(
    clubId as number,
    !!clubId // Chỉ fetch khi clubId tồn tại
  )

  // Biến loading tổng hợp (giống trang Event)
  const isLoading = productsLoading || tagsLoading

  // 3. Cập nhật các hàm handlers cho form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stockQuantity" || name === "eventId" ? (value === "" ? undefined : Number(value)) : value,
    }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagChange = (tagId: number) => (checked: boolean) => {
    setForm((prev) => {
      const currentTags = prev.tagIds || []
      if (checked) {
        // Add tag
        return { ...prev, tagIds: [...currentTags, tagId] }
      } else {
        // Remove tag
        return { ...prev, tagIds: currentTags.filter((id) => id !== tagId) }
      }
    })
  }

  // 4. Cập nhật hàm handleCreate
  const handleCreate = async () => {
    if (!clubId) {
      toast({ title: "Error", description: "Club ID does not exist.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      // Đảm bảo eventId là undefined nếu không phải EVENT_ITEM
      const payload: AddProductPayload = {
        ...form,
        eventId: form.productType === "EVENT_ITEM" ? form.eventId : undefined,
      }

      // API mới trả về object Product đã tạo
      await addProduct(clubId, payload)

      toast({ title: "Success", description: "Create successful products!", variant: "success" })
      setOpen(false)
      setForm(initialFormState) // Reset form
      // Tự động tải lại dữ liệu thay vì cập nhật thủ công
      queryClient.invalidateQueries({ queryKey: queryKeys.productsByClubId(clubId) })
      // Thêm sản phẩm mới vào đầu danh sách, không cần reload
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Create a failed product", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // THAY THẾ 'filteredProducts' BẰNG 'useMemo'
  const filteredAndSortedProducts = useMemo(() => {
    let filtered: Product[] = [...products] // Bắt đầu với danh sách đầy đủ

    // A. Lọc theo SearchTerm (từ Input)
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    // B. Lọc theo ProductFilters state (Client-side)
    if (filters) {
      // Lọc "Sẵn hàng"
      if (filters.inStock) {
        // Lọc cả isActive và stockQuantity
        filtered = filtered.filter((p) => p.isActive && p.stockQuantity > 0)
      }

      // Lọc "Tags"
      if (filters.selectedTags.size > 0) {
        const selectedTags = Array.from(filters.selectedTags)
        // Lọc các sản phẩm có CHỨA BẤT KỲ tag nào được chọn
        filtered = filtered.filter((p) =>
          selectedTags.some(selectedTag => p.tags.includes(selectedTag))
        )
      }
    }
    // C. Sắp xếp
    switch (sortBy) {
      case "price_asc":
        filtered.sort((a, b) => a.pointCost - b.pointCost)
        break
      case "price_desc":
        filtered.sort((a, b) => b.pointCost - a.pointCost)
        break
      case "hot_promo":
        // TODO: Cần logic để sort "Khuyến mãi HOT" (API không có)
        break
      case "popular":
      default:
        // TODO: Cần logic để sort "Phổ biến" (e.g., by sales, API không có)
        break
    }
    return filtered
  }, [products, searchTerm, filters, sortBy]) // Chạy lại khi 1 trong 4 giá trị này thay đổi

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gift Products</h1>
            <p className="text-muted-foreground">Manage club items and event products.</p>
          </div>
          <Input placeholder="Search for products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />

          {/* Nút Add Product - Đã đơn giản hóa onClick */}
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              onClick={() => {
                setForm(initialFormState) // Reset form khi mở
                setOpen(true)
              }}
              className="bg-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 text-white border-none"
              disabled={!clubId} // Vô hiệu hóa nếu chưa load được clubId
            >
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </Button>
          </div>

          <ProductFilters
            availableTags={productTags}
            onFilterChange={setFilters}
            onSortChange={setSortBy}
          />
          <Separator className="my-6" />

          {/* 6. Cập nhật Dialog Content */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add new products</DialogTitle>
              </DialogHeader>
              {/* Thêm ScrollArea cho form dài */}
              <ScrollArea className="max-h-[70vh] p-1">
                <div className="space-y-4 py-4 pr-3">
                  <div className="space-y-1">
                    <Label htmlFor="productType">Product Type</Label>
                    <Select name="productType" value={form.productType} onValueChange={handleSelectChange("productType")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLUB_ITEM">Club Item (Club Item)</SelectItem>
                        <SelectItem value="EVENT_ITEM">Event Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Hiển thị có điều kiện */}
                  {form.productType === "EVENT_ITEM" && (
                    <div className="space-y-1">
                      <Label htmlFor="eventId">Event ID</Label>
                      <Input
                        id="eventId"
                        name="eventId"
                        type="number"
                        value={form.eventId || ""}
                        onChange={handleChange}
                        placeholder="ID of the related event"
                        min={1}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="name">Product name</Label>
                    <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="e.g., F-Code Club T-Shirt" />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="description">Describe</Label>
                    <Textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Detailed product description..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="price">Price (Points)</Label>
                      <Input id="price" name="price" type="number" value={form.price} onChange={handleChange} placeholder="0" min={0} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="stockQuantity">Quantity in stock</Label>
                      <Input id="stockQuantity" name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange} placeholder="0" min={0} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    {productTags.length > 0 ? (
                      <ScrollArea className="h-24 rounded-md border p-3">
                        <div className="space-y-2">
                          {productTags.map((tag) => (
                            <div key={tag.tagId} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag.tagId}`}
                                checked={form.tagIds.includes(tag.tagId)}
                                onCheckedChange={(checked) => handleTagChange(tag.tagId)(checked as boolean)}
                              />
                              <Label htmlFor={`tag-${tag.tagId}`} className="font-normal">
                                {tag.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">There are no tags for this club.</p>
                    )}
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? "Creating..." : "Create a product"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Product Card Rendering */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full text-center py-12">Loading products...</div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-sm text-muted-foreground">Try adding new products!</p>
              </div>
            ) : (
              filteredAndSortedProducts.map((p) => {
                // Lấy thumbnail (hoặc ảnh placeholder nếu không có)
                const thumbnail = p.media?.find((m) => m.isThumbnail)?.url || "/placeholder.svg"

                return (
                  // 1. Bọc thẻ Card bằng Link
                  <Link
                    href={`/club-leader/gift/${p.productId}`}
                    key={p.productId}
                    className="h-full flex" // Thêm 'flex' để Card con có thể co giãn 100%
                  >
                    {/* 2. Cập nhật Card styling (shadow, cursor, v.v.) */}
                    <Card className="transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col h-full relative overflow-hidden w-full">

                      {/* Phần Header (Hình ảnh) - Thay đổi để giống thiết kế */}
                      <CardHeader className="p-0 border-b"> {/* Xóa padding */}
                        <div className="aspect-video w-full relative overflow-hidden bg-muted">
                          {/* Dùng placeholder nếu ảnh lỗi */}
                          <img
                            src={thumbnail}
                            alt={p.name}
                            className="object-cover w-full h-full"
                            onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                          />
                          {/* Badge Active/Inactive (Giống trong ảnh) */}
                          <Badge
                            variant={p.isActive ? "default" : "secondary"}
                            className={`absolute right-2 top-2 z-10 text-xs ${p.isActive ? "bg-green-600 text-white" : "bg-gray-500 text-white"
                              }`}
                          >
                            {p.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>

                      {/* Phần Content (Thông tin) - Thay đổi để giống thiết kế */}
                      <CardContent className="p-3 flex flex-col gap-2 grow">
                        {/* Title và Description */}
                        <div className="min-w-0">
                          <CardTitle className="text-base font-semibold truncate" title={p.name}>
                            {p.name}
                          </CardTitle>
                          <CardDescription className="mt-1 text-sm line-clamp-2" title={p.description}>
                            {p.description || "No description provided."}
                          </CardDescription>
                        </div>

                        {/* Tags (Giống trong ảnh) */}
                        {p.tags && p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="default" // Màu xanh
                                className="text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Giá và Kho (Đẩy xuống dưới) */}
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <span className="font-semibold text-blue-600 text-base">
                            {p.pointCost} points
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Warehouse: {p.stockQuantity}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
