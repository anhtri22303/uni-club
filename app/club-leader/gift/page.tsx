"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  Gift, Package, Calendar, Clock, CheckCircle, XCircle, Plus, ChevronLeft, ChevronRight, Loader2, Archive,
  WalletCards, Tag as TagIcon,
} from "lucide-react"
// --- Service ---
import { addProduct, Product, AddProductPayload, } from "@/service/productApi"
import { getClubIdFromToken } from "@/service/clubApi"
// --- Hooks ---
import { usePagination } from "@/hooks/use-pagination"
import { useToast } from "@/hooks/use-toast" // Đảm bảo import useToast đúng cách
import { useProductsByClubId, useProductTags, queryKeys, } from "@/hooks/use-query-hooks"
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
import { Tag } from "@/service/tagApi"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getEventByClubId, Event } from "@/service/eventApi"

// ---- Compact status badge overlay ----
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

// --- Minimal Pager  ---
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
  pointCost: 0,
  stockQuantity: 0,
  type: "CLUB_ITEM",
  tagIds: [],
  eventId: 0,
}
// Định nghĩa ID cho tag cố định
interface FixedTagIds {
  clubTagId: number | null;
  eventTagId: number | null;
}

// Giới hạn độ dài description
const MAX_DESCRIPTION_LENGTH = 500;

export default function ClubLeaderGiftPage() {
  const [clubId, setClubId] = useState<number | null>(() => getClubIdFromToken())
  const [searchTerm, setSearchTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AddProductPayload>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const [filters, setFilters] = useState<FilterState | null>(null)
  const [sortBy, setSortBy] = useState<SortState>("popular")
  const queryClient = useQueryClient()
  const [tagSearchTerm, setTagSearchTerm] = useState("")
  // STATE ĐỂ LƯU ID CỦA TAG "CLUB" VÀ "EVENT"
  const [fixedTagIds, setFixedTagIds] = useState<FixedTagIds>({
    clubTagId: null,
    eventTagId: null,
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "archived">("all");
  
  // Kiểm tra description có vượt quá giới hạn
  const isDescriptionTooLong = form.description.length > MAX_DESCRIPTION_LENGTH;

  useEffect(() => {
    const id = getClubIdFromToken();
    if (id) {
      setClubId(id);
    } else {
      toast({ title: "Error", description: "Club ID not found.", variant: "destructive" });
      // có thể thêm router.push('/login') ở đây
    }
  }, [toast]); // Chỉ chạy 1 lần

  // THAY THẾ useEffect/useState BẰNG REACT QUERY
  const { data: products = [], isLoading: productsLoading } = useProductsByClubId(
    clubId as number,
    !!clubId // Chỉ fetch khi clubId tồn tại
  )
  const { data: productTags = [], isLoading: tagsLoading } = useProductTags(
    !!clubId // Chỉ fetch khi clubId tồn tại
  )

  // Fetch events cho club
  const { data: clubEvents = [], isLoading: eventsLoading } = useQuery<Event[]>({
    // Cần queryKey duy nhất, thêm 'clubId' để nó fetch lại khi clubId thay đổi
    queryKey: ['clubEvents', clubId],
    queryFn: () => getEventByClubId(clubId as number),
    // Chỉ fetch khi có clubId VÀ dialog đang mở (tối ưu)
    enabled: !!clubId && open,
  });
  // Lọc các event hợp lệ (APPROVED và chưa/đang diễn ra, hoặc ON-GOING)
  const availableEvents = useMemo(() => {
    if (!clubEvents) return [];

    // Lấy thời điểm đầu ngày hôm nay (00:00:00) theo giờ địa phương
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return clubEvents.filter(event => {
      const parts = event.date.split('-').map(Number);
      // new Date(year, monthIndex, day)
      const eventDate = new Date(parts[0], parts[1] - 1, parts[2]);

      // Điều kiện 1: Event đang diễn ra (ON-GOING) thì luôn hiển thị
      if (event.status === "ON-GOING") {
        return true;
      }
      if (event.status === "APPROVED" && eventDate >= today) {
        return true;
      }

      // Tất cả các trường hợp khác (PENDING, REJECTED, APPROVED nhưng đã qua ngày)
      return false;
    });
  }, [clubEvents]);

  // useEffect ĐỂ TÌM VÀ SET ID CỦA TAG CỐ ĐỊNH
  useEffect(() => {
    if (productTags.length > 0) {
      const clubTag = productTags.find(tag => tag.name.toLowerCase() === "club");
      const eventTag = productTags.find(tag => tag.name.toLowerCase() === "event");

      const ids: FixedTagIds = {
        clubTagId: clubTag ? clubTag.tagId : null,
        eventTagId: eventTag ? eventTag.tagId : null,
      };
      setFixedTagIds(ids);

      // Tự động set tag "Club" mặc định khi tải xong
      if (ids.clubTagId) {
        setForm(prev => ({
          ...initialFormState,
          tagIds: [ids.clubTagId as number]
        }));
      } else {
        setForm(initialFormState); // Reset nếu không tìm thấy tag
      }
    }
  }, [productTags]); // Chạy lại khi productTags tải xong
  // Biến loading tổng hợp
  const isLoading = productsLoading || tagsLoading


  // 3. Cập nhật các hàm handlers cho form 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === "pointCost" || name === "stockQuantity" || name === "eventId" ? (value === "" ? 0 : Number(value)) : value,
    }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    // Chỉ xử lý logic đặc biệt khi đổi 'type'
    if (name === "type") {
      const { clubTagId, eventTagId } = fixedTagIds;

      setForm((prev) => {
        let newTagIds = [...prev.tagIds];

        // Lọc bỏ cả 2 tag cố định
        newTagIds = newTagIds.filter(id => id !== clubTagId && id !== eventTagId);

        // Thêm tag tương ứng
        if (value === "CLUB_ITEM" && clubTagId) {
          newTagIds.push(clubTagId);
        } else if (value === "EVENT_ITEM" && eventTagId) {
          newTagIds.push(eventTagId);
        }

        const isEventItem = value === "EVENT_ITEM";
        return {
          ...prev,
          [name]: value,
          tagIds: newTagIds,
          eventId: isEventItem ? prev.eventId : 0 // Reset nếu không phải Event Item
        };
      });
    } else {
      // Giữ nguyên logic cũ cho các select khác (nếu có)
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  // Handler mới cho việc chọn Event từ Select
  const handleEventSelectChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      eventId: Number(value) || 0, // Chuyển giá trị string từ Select về number
    }));
  };

  const handleTagChange = (tagId: number) => (checked: boolean) => {
    const { clubTagId, eventTagId } = fixedTagIds;
    // Nếu tag là tag cố định, không cho làm gì cả
    if (tagId === clubTagId || tagId === eventTagId) {
      return;
    }

    setForm((prev) => {
      const currentTags = prev.tagIds || []
      if (checked) {
        return { ...prev, tagIds: [...currentTags, tagId] }
      } else {
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

    // KIỂM TRA NGHIỆP VỤ MỚI
    if (!form.tagIds || form.tagIds.length === 0) {
      toast({ title: "Error", description: "Product must have at least one tag.", variant: "destructive" })
      return;
    }

    // Kiểm tra Event ID nếu là Event Item
    if (form.type === "EVENT_ITEM" && (!form.eventId || form.eventId === 0)) {
      toast({ title: "Error", description: "You must select an event for an Event Item.", variant: "destructive" })
      return;
    }

    setSubmitting(true)
    try {
      // Đảm bảo eventId là 0 nếu không phải EVENT_ITEM
      const payload: AddProductPayload = {
        ...form,
        eventId: form.type === "EVENT_ITEM" ? form.eventId : 0, // (từ productType sang type)
      }

      await addProduct(clubId, payload)

      toast({ title: "Success", description: "Create successful products!", variant: "success" })
      setOpen(false)
      // setForm(initialFormState) // Reset form
      // Reset form về trạng thái có tag "club"
      if (fixedTagIds.clubTagId) {
        setForm({
          ...initialFormState,
          tagIds: [fixedTagIds.clubTagId]
        });
      } else {
        setForm(initialFormState);
      }
      setTagSearchTerm("") // Reset search tag khi tạo thành công
      queryClient.invalidateQueries({ queryKey: queryKeys.productsByClubId(clubId) })
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Create a failed product", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }
  const filteredAndSortedProducts = useMemo(() => {
    let filtered: Product[] = [...products] // 1. Bắt đầu với TẤT CẢ (gồm cả Archived)

    // --- LỌC BƯỚC 1: LỌC THEO STATUS (Tab) ---
    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.status === "ACTIVE");
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => p.status === "INACTIVE");
    } else if (statusFilter === "archived") {
      filtered = filtered.filter((p) => p.status === "ARCHIVED");
    }
    // Nếu statusFilter === "all", bỏ qua bước này, giữ nguyên TẤT CẢ

    // --- LỌC BƯỚC 2: LỌC THEO SEARCH TERM ---
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // --- LỌC BƯỚC 3: LỌC THEO CRITERIA (Checkbox và Tags) ---
    if (filters) {
      // Lọc "Available" (Sẵn hàng)
      if (filters.inStock) {
        // Lọc này chỉ có ý nghĩa với các sản phẩm ACTIVE
        filtered = filtered.filter((p) => p.status === "ACTIVE" && p.stockQuantity > 0)
      }

      // Lọc "Tags"
      if (filters.selectedTags.size > 0) {
        const selectedTags = Array.from(filters.selectedTags)
        filtered = filtered.filter((p) =>
          selectedTags.some(selectedTag => p.tags.includes(selectedTag))
        )
      }
    }

    // --- BƯỚC 4: SẮP XẾP ---
    switch (sortBy) {
      case "price_asc":
        filtered.sort((a, b) => a.pointCost - b.pointCost)
        break
      case "price_desc":
        filtered.sort((a, b) => b.pointCost - a.pointCost)
        break
      case "hot_promo":
        // (chưa có logic)
        break
      case "popular":
      default:
        // (chưa có logic)
        break
    }
    return filtered
  }, [products, searchTerm, filters, sortBy, statusFilter])

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-8">
          {/* Header Section with Enhanced Design */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Gift Products
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Manage your club items and event products efficiently
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => {
                // setForm(initialFormState) // Reset form khi mở
                // Reset form về trạng thái có tag "club"
                if (fixedTagIds.clubTagId) {
                  setForm({
                    ...initialFormState,
                    tagIds: [fixedTagIds.clubTagId]
                  });
                } else {
                  setForm(initialFormState);
                }
                setTagSearchTerm("") // THÊM: Reset search tag
                setOpen(true)
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={!clubId}
            >
              <Plus className="h-5 w-5 mr-2" /> 
              Add New Product
            </Button>
          </div>

          {/* Search Bar - Full Width with Better Design */}
          <div className="relative">
            <Input 
              placeholder="Search for products by name or description..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="h-12 pl-12 text-base border-2 focus:border-blue-500 transition-colors" 
            />
            <Gift className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>

          {/* Filter Section with Modern Card Design */}
          <Card className="border-2 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-6 flex-wrap">
                {/* SELECT BY CRITERIA SECTION (LEFT) */}
                <div className="flex-1 min-w-[300px]">
                  <ProductFilters
                    availableTags={productTags}
                    onFilterChange={setFilters}
                    onSortChange={setSortBy}
                  />
                </div>

                {/* VERTICAL SEPARATOR */}
                <Separator orientation="vertical" className="h-20" />

                {/* FILTER STATUS SECTION (RIGHT) */}
                <div className="flex flex-col gap-3">
                  <Label className="text-base font-semibold text-gray-700">Filter by Status</Label>
                  <ToggleGroup
                    type="single"
                    value={statusFilter}
                    onValueChange={(value: "all" | "active" | "inactive" | "archived") => {
                      if (value) setStatusFilter(value); // Chỉ set khi có giá trị
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <ToggleGroupItem value="all" aria-label="Show all" className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700">
                      All
                    </ToggleGroupItem>
                    <ToggleGroupItem value="active" aria-label="Show active only" className="data-[state=on]:bg-green-100 data-[state=on]:text-green-700">
                      Active
                    </ToggleGroupItem>
                    <ToggleGroupItem value="inactive" aria-label="Show inactive only" className="data-[state=on]:bg-gray-100 data-[state=on]:text-gray-700">
                      Inactive
                    </ToggleGroupItem>
                    <ToggleGroupItem value="archived" aria-label="Show archived only" className="data-[state=on]:bg-red-100 data-[state=on]:text-red-700">
                      Archived
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    <Label htmlFor="type">Product Type</Label>
                    <Select name="type" value={form.type} onValueChange={handleSelectChange("type")}>
                      <SelectTrigger className="mt-2 border-slate-300">
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLUB_ITEM">Club Item</SelectItem>
                        <SelectItem value="EVENT_ITEM">Event Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Hiển thị có điều kiện */}
                  {form.type === "EVENT_ITEM" && (
                    <div className="space-y-1">
                      <Label htmlFor="eventId">Event</Label>
                      {/* Thay thế Input bằng Select */}
                      <Select
                        name="eventId"
                        // Select value phải là string, và 0 hoặc "" để placeholder hiển thị
                        value={form.eventId ? String(form.eventId) : ""}
                        onValueChange={handleEventSelectChange} // Dùng handler mới
                      >
                        <SelectTrigger className="mt-2 border-slate-300">
                          <SelectValue placeholder="Select an approved or on-going event" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventsLoading ? (
                            <SelectItem value="loading" disabled>Loading events...</SelectItem>
                          ) : availableEvents.length > 0 ? (
                            // Map qua các event đã lọc
                            availableEvents.map((event) => (
                              <SelectItem key={event.id} value={String(event.id)}>
                                {event.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-events" disabled>No available events found</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="name">Product name</Label>
                    <Input id="name" className="mt-2 border-slate-300" name="name" value={form.name} onChange={handleChange} placeholder="e.g., F-Code Club T-Shirt" />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="description">Describe</Label>
                    <Textarea 
                      id="description" 
                      className={`mt-2 border-slate-300 ${isDescriptionTooLong ? 'border-red-500 focus:border-red-500' : ''}`}
                      name="description" 
                      value={form.description} 
                      onChange={handleChange} 
                      placeholder="Detailed product description..."
                      rows={4}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex-1">
                        {isDescriptionTooLong && (
                          <p className="text-sm text-red-600 font-medium">
                            Description exceeds the maximum length of {MAX_DESCRIPTION_LENGTH} characters. 
                            Please shorten your description by {form.description.length - MAX_DESCRIPTION_LENGTH} characters.
                          </p>
                        )}
                      </div>
                      <span className={`text-xs ml-2 ${isDescriptionTooLong ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                        {form.description.length} / {MAX_DESCRIPTION_LENGTH}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="pointCost">Price (Points)</Label>
                      <Input id="pointCost" className="mt-2 border-slate-300" name="pointCost" type="number" value={form.pointCost} onChange={handleChange} placeholder="0" min={0} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="stockQuantity">Quantity in stock</Label>
                      <Input id="stockQuantity" className="mt-2 border-slate-300" name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange} placeholder="0" min={0} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input
                      placeholder="Search tags..."
                      value={tagSearchTerm}
                      onChange={(e) => setTagSearchTerm(e.target.value)}
                      className="mb-2 border-slate-300"
                    />
                    {productTags.length > 0 ? (
                      <ScrollArea className="h-24 rounded-md border p-3 2 border-slate-300">
                        <div className="space-y-2">
                          {productTags
                            .filter((tag) =>
                              tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
                            )
                            .map((tag: Tag) => { //Dùng kiểu 'Tag'

                              // KIỂM TRA XEM TAG CÓ BỊ VÔ HIỆU HÓA KHÔNG
                              const isDisabled =
                                tag.tagId === fixedTagIds.clubTagId ||
                                tag.tagId === fixedTagIds.eventTagId;

                              return (
                                <div key={tag.tagId} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`tag-${tag.tagId}`}
                                    checked={form.tagIds.includes(tag.tagId)}
                                    onCheckedChange={(checked) => handleTagChange(tag.tagId)(checked as boolean)}
                                    disabled={isDisabled}
                                    aria-label={tag.name}
                                  />
                                  <Label
                                    htmlFor={`tag-${tag.tagId}`}
                                    className={`font-normal ${isDisabled ? 'text-muted-foreground cursor-not-allowed' : ''}`} // Style cho tag bị disable
                                  >
                                    {tag.name}
                                    {isDisabled && " (Auto)"}
                                  </Label>
                                </div>
                              );
                            })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">There are no tags for this club.</p>
                    )}
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setOpen(false)
                    setTagSearchTerm("")
                  }}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={submitting || isDescriptionTooLong}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Product
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Product Card Rendering with Enhanced Design */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {isLoading ? (
              <div className="col-span-full text-center py-20">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-lg text-muted-foreground">Loading products...</p>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-700">No products found</h3>
                <p className="text-base text-muted-foreground max-w-md mx-auto">
                  {statusFilter === "archived" 
                    ? "Your archive is empty. Archived products will appear here." 
                    : "Try adjusting your filters or create a new product to get started."}
                </p>
              </div>
            ) : (
              filteredAndSortedProducts.map((p) => {
                const thumbnail = p.media?.find((m) => m.thumbnail)?.url || "/placeholder.svg"

                return (
                  <Link
                    href={`/club-leader/gift/${p.id}`}
                    key={p.id}
                    className="group"
                  >
                    {/* Modern Card Design with Enhanced Visual Hierarchy */}
                    <Card className="h-full flex flex-col overflow-hidden border-2 border-gray-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-blue-400 bg-white">
                      
                      {/* Image Container with Overlay Effect */}
                      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        <img
                          src={thumbnail}
                          alt={p.name}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-105"
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        />
                        
                        {/* Gradient Overlay on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Status Badge - Top Right */}
                        <Badge
                          className={`absolute right-3 top-3 z-10 px-2.5 py-1 text-xs font-bold shadow-xl border-2 transition-transform duration-300 group-hover:scale-110
                            ${p.status === "ACTIVE" ? "bg-green-500 hover:bg-green-600 text-white border-white/50" : ""}
                            ${p.status === "INACTIVE" ? "bg-gray-500 hover:bg-gray-600 text-white border-white/50" : ""}
                            ${p.status === "ARCHIVED" ? "bg-red-600 hover:bg-red-700 text-white border-white/50" : ""}
                          `}
                        >
                          {p.status === "ACTIVE" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {p.status === "INACTIVE" && <XCircle className="h-3 w-3 mr-1" />}
                          {p.status === "ARCHIVED" && <Archive className="h-3 w-3 mr-1" />}
                          {p.status}
                        </Badge>
                      </div>

                      {/* Card Body */}
                      <CardContent className="flex-1 flex flex-col p-4 gap-3">
                        {/* Product Title */}
                        <div className="space-y-1.5">
                          <h3 className="font-bold text-base leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors duration-200" title={p.name}>
                            {p.name}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed min-h-[2rem]" title={p.description}>
                            {p.description || "No description provided."}
                          </p>
                        </div>

                        {/* Tags */}
                        {p.tags && p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-colors"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {p.tags.length > 2 && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border border-gray-200"
                              >
                                +{p.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Price and Stock - Compact Design */}
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between gap-2">
                            {/* Price Section */}
                            <div className="flex items-center gap-1.5 flex-1">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm">
                                <WalletCards className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Price</span>
                                <span className="font-bold text-sm text-blue-600 truncate">
                                  {p.pointCost.toLocaleString('en-US')}
                                </span>
                              </div>
                            </div>
                            
                            {/* Divider */}
                            <div className="w-px h-10 bg-gray-200" />
                            
                            {/* Stock Section */}
                            <div className="flex items-center gap-1.5 flex-1">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center shadow-sm ${
                                p.stockQuantity === 0 
                                  ? 'bg-gradient-to-br from-red-500 to-red-600' 
                                  : 'bg-gradient-to-br from-gray-500 to-gray-600'
                              }`}>
                                <Package className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">Stock</span>
                                <span className={`font-bold text-sm truncate ${
                                  p.stockQuantity === 0 ? 'text-red-600' : 'text-gray-700'
                                }`}>
                                  {p.stockQuantity.toLocaleString('en-US')}
                                </span>
                              </div>
                            </div>
                          </div>
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
