"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { getProductById, getProductTags, Product, AddProductPayload, ProductTag, } from "@/service/productApi"
import { useToast } from "@/hooks/use-toast"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Loader2, Package, DollarSign, Archive, Tag, Image as ImageIcon, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { getClubIdFromToken } from "@/service/clubApi"

type ProductEditForm = AddProductPayload & {
    isActive: boolean
}

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()

    const [product, setProduct] = useState<Product | null>(null) // Dữ liệu gốc
    const [form, setForm] = useState<ProductEditForm | null>(null)
    const [allTags, setAllTags] = useState<ProductTag[]>([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [clubId, setClubId] = useState<number | null>(null)
    const productId = params.id as string
    const [tagSearchTerm, setTagSearchTerm] = useState("")
    // 1. Lấy clubId
    useEffect(() => {
        const id = getClubIdFromToken()
        if (id) {
            setClubId(id)
        } else {
            toast({ title: "Error", description: "Club ID not found.", variant: "destructive" })
            router.back()
        }
    }, [router, toast])

    // 2. Fetch dữ liệu của sản phẩm và
    useEffect(() => {
        // if (!clubId || !productId) return

        async function fetchData() {
            // 1. Chuyển câu lệnh check vào ĐẦU hàm async
            if (!clubId || !productId) {
                setLoading(false); // Đặt loading là false nếu ta không fetch
                return;
            }
            try {
                setLoading(true)
                // Fetch song song
                const [productData, tagsData] = await Promise.all([
                    getProductById(clubId, productId),
                    getProductTags(clubId),
                ])

                setProduct(productData)
                setAllTags(tagsData)

                // --- QUAN TRỌNG: Chuyển đổi dữ liệu cho form ---
                const loadedTagIds = tagsData
                    .filter((tag) => productData.tags.includes(tag.name))
                    .map((tag) => tag.tagId)

                // Khởi tạo form state
                setForm({
                    name: productData.name,
                    description: productData.description,
                    price: productData.pointCost,
                    stockQuantity: productData.stockQuantity,
                    productType: productData.type || "CLUB_ITEM",
                    eventId: productData.eventId || undefined,
                    tagIds: loadedTagIds,
                    isActive: productData.isActive,
                })
            } catch (error) {
                console.error("Failed to load product details:", error)
                toast({
                    title: "Error",
                    description: "Unable to load product details.",
                    variant: "destructive",
                })
                router.back()
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [clubId, productId, router, toast])

    // 3. Handlers cho form (Giữ nguyên)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (!form) return

        setForm({
            ...form,
            [name]: name === "price" || name === "stockQuantity" || name === "eventId"
                ? (value === "" ? undefined : Number(value))
                : value,
        })
    }

    const handleSelectChange = (name: string) => (value: string) => {
        if (!form) return
        setForm({ ...form, [name]: value })
    }

    const handleSwitchChange = (name: string) => (checked: boolean) => {
        if (!form) return
        setForm({ ...form, [name]: checked })
    }

    const handleTagChange = (tagId: number) => (checked: boolean) => {
        if (!form) return
        const currentTags = form.tagIds || []
        let newTagIds: number[]
        if (checked) {
            newTagIds = [...currentTags, tagId]
        } else {
            newTagIds = currentTags.filter((id) => id !== tagId)
        }
        setForm({ ...form, tagIds: newTagIds })
    }

    // 4. Handler LƯU (Vô hiệu hóa)
    const handleSave = async () => {
        if (!form || !clubId || !productId) return

        // 4. VÔ HIỆU HÓA TÍNH NĂNG UPDATE
        toast({
            title: "Feature in development",
            description: "Product update API not ready yet.",
            variant: "default", // Dùng "info" thay vì "destructive"
        })
        return;
    }

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={["club_leader"]}>
                <AppShell>
                    <LoadingSkeleton className="h-96" />
                </AppShell>
            </ProtectedRoute>
        )
    }

    if (!form || !product) {
        // Xử lý khi không tìm thấy form (lỗi fetch)
        return (
            <ProtectedRoute allowedRoles={["club_leader"]}>
                <AppShell>
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Come back
                    </Button>
                    <Card>
                        <CardContent className="py-12 text-center">
                            <h3 className="text-lg font-semibold">No products found</h3>
                        </CardContent>
                    </Card>
                </AppShell>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute allowedRoles={["club_leader"]}>
            <AppShell>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Gift page
                            </Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">ID: #{product.productId}</span>

                            {/* 4. SỬA NÚT SAVE */}
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Save changes
                            </Button>
                        </div>
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Cột trái: Thông tin chính */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Product details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="name">Product name</Label>
                                        <Input id="name" name="name" value={form.name} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={form.description}
                                            onChange={handleChange}
                                            rows={5}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Image</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {product.media && product.media.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-4">
                                            {product.media.map((m) => (
                                                <div key={m.mediaId} className="relative aspect-square">
                                                    <img
                                                        src={m.url}
                                                        alt="Product media"
                                                        className="object-cover w-full h-full rounded-md"
                                                    />
                                                    {m.isThumbnail && (
                                                        <Badge className="absolute top-2 left-2">Thumbnail</Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">There are no images for this product yet..</p>
                                    )}
                                    {/* TODO: Thêm nút Upload/Quản lý hình ảnh */}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Cột phải: Thông tin phụ */}
                        <div className="md:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Status</CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center justify-between space-x-2">
                                    <Label htmlFor="isActive" className="flex flex-col space-y-1">
                                        <span>{form.isActive ? "Active" : "Inactive"}</span>
                                        <span className="font-normal leading-snug text-muted-foreground">
                                            {form.isActive ? "Products are on sale." : "Hidden product."}
                                        </span>
                                    </Label>
                                    <Switch
                                        id="isActive"
                                        name="isActive"
                                        checked={form.isActive}
                                        onCheckedChange={handleSwitchChange("isActive")}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Classify</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="productType">Product Type</Label>
                                        <Select
                                            name="productType"
                                            value={form.productType} // 👈 SỬA: Dùng 'productData.type'
                                            onValueChange={handleSelectChange("productType")}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select product type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CLUB_ITEM">Club Item</SelectItem>
                                                <SelectItem value="EVENT_ITEM">Event Item</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {form.productType === "EVENT_ITEM" && (
                                        <div className="space-y-1">
                                            <Label htmlFor="eventId">Event ID</Label>
                                            <Input
                                                id="eventId"
                                                name="eventId"
                                                type="number"
                                                value={form.eventId || ""}
                                                onChange={handleChange}
                                                min={1}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Price & Inventory</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="price">Price (Points)</Label>
                                        {/* 5. SỬA: Đảm bảo Input name='price' khớp với form state */}
                                        <Input id="price" name="price" type="number" value={form.price} onChange={handleChange} min={0} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="stockQuantity">Quantity in stock</Label>
                                        <Input id="stockQuantity" name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange} min={0} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Tags</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        placeholder="Search tag..."
                                        value={tagSearchTerm}
                                        onChange={(e) => setTagSearchTerm(e.target.value)}
                                        className="mb-3" // Thêm khoảng cách
                                    />

                                    {allTags.length > 0 ? (
                                        <ScrollArea className="h-48 rounded-md border p-3">
                                            <div className="space-y-2">
                                                {allTags
                                                    .filter((tag) =>
                                                        tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
                                                    )
                                                    .map((tag) => (
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
                                        <p className="text-sm text-muted-foreground">No tags.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </AppShell>
        </ProtectedRoute>
    )
}