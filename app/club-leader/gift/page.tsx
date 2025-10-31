"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { Gift, Package, Calendar, Clock, CheckCircle, XCircle, Plus, ChevronLeft, ChevronRight, } from "lucide-react"
// --- Service ---
import { getProducts, addProduct, getProductTags, Product, AddProductPayload, ProductTag, } from "@/service/productApi"
// --- Hooks ---
import { usePagination } from "@/hooks/use-pagination"
import { useToast } from "@/hooks/use-toast" // Đảm bảo import useToast đúng cách
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
import { ProductFilters, FilterState, SortState } from "@/components/ProductFilters"
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
  const [products, setProducts] = useState<Product[]>([])
  const [productTags, setProductTags] = useState<ProductTag[]>([])
  const [clubId, setClubId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AddProductPayload>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  // 2. THÊM STATE MỚI CHO FILTER VÀ SORT
  const [filters, setFilters] = useState<FilterState | null>(null)
  const [sortBy, setSortBy] = useState<SortState>("popular")

  // 1. Lấy clubId từ localStorage khi component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const auth = localStorage.getItem("uniclub-auth")
        if (auth) {
          const parsed = JSON.parse(auth)
          if (parsed.clubId) {
            setClubId(parsed.clubId)
          } else {
            toast({ title: "Error", description: "Club ID not found in login information.", variant: "destructive" })
          }
        }
      } catch (err) {
        console.error("Failed to parse auth from localStorage", err)
        toast({ title: "Error", description: "Unable to read Club ID information.", variant: "destructive" })
      }
    }
  }, [toast])

  // 2. Fetch products và tags khi clubId đã được set
  useEffect(() => {
    // if (!clubId) return // Chưa có clubId thì không fetch

    async function fetchAllData() {
      if (!clubId) {
        // Nếu chưa có clubId, ta nên set loading = false và không làm gì cả
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        // Fetch song song
        const [productsData, tagsData] = await Promise.all([
          getProducts(clubId, { page: 0, size: 70 }),
          getProductTags(clubId),
        ])
        setProducts(productsData)
        setProductTags(tagsData)
      } catch (err) {
        setProducts([])
        setProductTags([])
        toast({ title: "Error", description: "Unable to load products or tags.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchAllData()
  }, [clubId, toast]) // Phụ thuộc vào clubId

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
      const newProduct = await addProduct(clubId, payload)

      toast({ title: "Success", description: "Create successful products!", variant: "success" })
      setOpen(false)
      setForm(initialFormState) // Reset form

      // Thêm sản phẩm mới vào đầu danh sách, không cần reload
      setProducts((prev) => [newProduct, ...prev])
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Create a failed product", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // // 5. Cập nhật logic filter (vẫn giữ nguyên)
  // const filteredProducts = products.filter(
  //   (p) =>
  //     p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     p.description.toLowerCase().includes(searchTerm.toLowerCase())
  // )
  // 5. THAY THẾ 'filteredProducts' BẰNG 'useMemo'
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
        filtered = filtered.filter((p) => p.stockQuantity > 0)
      }

      // Lọc "Hàng mới về"
      if (filters.newArrivals) {
        // TODO: Cần logic để xác định hàng mới (API không có trường này)
        // Ví dụ: filtered = filtered.filter((p) => isNew(p.createdAt));
        // Tạm thời bỏ qua
      }

      if (filters.useCases.size > 0) {
        // QUAN TRỌNG: Component 'ProductFilters' đang dùng data giả (e.g., "van_phong").
        // Bạn cần cập nhật 'ProductFilters.tsx' để nhận 'productTags' từ API
        // và hiển thị chúng làm lựa chọn. Nếu không, bộ lọc này sẽ không
        // tìm thấy sản phẩm nào (vì tag "van_phong" không khớp với "Áo CLB").
        //
        // Logic ví dụ (giả sử `productTags` đã được nạp vào ProductFilters):
        // const useCaseTags = Array.from(filters.useCases);
        // filtered = filtered.filter((p) =>
        //   useCaseTags.some(tagValue => p.tags.includes(tagValue))
        // );
      }

      // Lọc "Hãng sản xuất" (Brands)
      if (filters.brands.size > 0) {
        // TODO: Product API không có trường 'brand'.
      }
    }

    // C. Sắp xếp
    switch (sortBy) {
      case "price_asc":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price_desc":
        filtered.sort((a, b) => b.price - a.price)
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
            onFilterChange={setFilters}
            onSortChange={setSortBy}
          />
          <Separator className="my-6" />

          {/* 6. Cập nhật Dialog Content */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Thêm sản phẩm mới</DialogTitle>
              </DialogHeader>
              {/* Thêm ScrollArea cho form dài */}
              <ScrollArea className="max-h-[70vh] p-1">
                <div className="space-y-4 py-4 pr-3">
                  <div className="space-y-1">
                    <Label htmlFor="productType">Loại sản phẩm</Label>
                    <Select name="productType" value={form.productType} onValueChange={handleSelectChange("productType")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại sản phẩm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLUB_ITEM">Club Item (Vật phẩm Club)</SelectItem>
                        <SelectItem value="EVENT_ITEM">Event Item (Vật phẩm Sự kiện)</SelectItem>
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
                        placeholder="ID của sự kiện liên quan"
                        min={1}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="name">Tên sản phẩm</Label>
                    <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="e.g., Áo thun CLB F-Code" />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Mô tả chi tiết sản phẩm..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="price">Giá (Points)</Label>
                      <Input id="price" name="price" type="number" value={form.price} onChange={handleChange} placeholder="0" min={0} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="stockQuantity">Số lượng trong kho</Label>
                      <Input id="stockQuantity" name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange} placeholder="0" min={0} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags (Nhãn)</Label>
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
                      <p className="text-sm text-muted-foreground">Không có tag nào cho club này.</p>
                    )}
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting ? "Đang tạo..." : "Tạo sản phẩm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 7. Cập nhật Product Card Rendering */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full text-center py-12">Đang tải sản phẩm...</div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Không tìm thấy sản phẩm nào</h3>
                <p className="text-sm text-muted-foreground">Hãy thử thêm sản phẩm mới!</p>
              </div>
            ) : (
              filteredAndSortedProducts.map((p) => {
                // Lấy thumbnail từ mảng media
                const thumbnail = p.media?.find((m) => m.isThumbnail)?.url || "/placeholder.svg"

                return (
                  <Card key={p.productId} className="transition-all duration-200 hover:shadow-md flex flex-col h-full relative overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="h-28 md:h-32 w-full relative mb-2 overflow-hidden rounded-lg bg-muted">
                        <img src={thumbnail} alt={p.name} className="object-cover w-full h-full" />

                        {/* Badge Trạng thái Active */}
                        <Badge
                          variant={p.isActive ? "default" : "secondary"}
                          className={`absolute right-2 top-2 z-10 text-xs ${p.isActive ? "bg-green-600 text-white" : ""}`}
                        >
                          {p.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-sm truncate">{p.name}</CardTitle>
                          <CardDescription className="mt-1 text-xs line-clamp-2">{p.description}</CardDescription>
                        </div>
                        {/* <Badge variant="outline" className="capitalize text-[10px] max-w-[6rem] truncate">
                          Club ID: {p.clubId}
                        </Badge> */}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 flex flex-col gap-2 grow">
                      {/* Hiển thị Tags */}
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs font-normal">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Giá và Tồn kho (đẩy xuống dưới) */}
                      <div className="flex items-center justify-between text-xs mt-auto pt-2">
                        <span className="font-semibold text-blue-600">{p.price} pts</span>
                        <span className="text-muted-foreground">Kho: {p.stockQuantity}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}