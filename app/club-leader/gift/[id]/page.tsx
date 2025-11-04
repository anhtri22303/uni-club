"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
    getProductById, Product, AddProductPayload, updateProduct, UpdateProductPayload, addMediaToProduct, deleteMediaFromProduct,
    updateMedia, UpdateMediaPayload,
} from "@/service/productApi"
import { getTags, Tag as ProductTag } from "@/service/tagApi" // 👈 THÊM DÒNG NÀY
import { useToast } from "@/hooks/use-toast"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Loader2, Package, DollarSign, Archive, Tag, Image as ImageIcon, CheckCircle, Upload, Trash, Star, } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { getClubIdFromToken } from "@/service/clubApi"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog"

type ProductEditForm = UpdateProductPayload
interface FixedTagIds {
    clubTagId: number | null;
    eventTagId: number | null;
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
    // STATE MEDIA DIALOG
    // const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false)
    // const [newMediaUrl, setNewMediaUrl] = useState("")
    // const [isMediaLoading, setIsMediaLoading] = useState(false)
    // const [newMediaIsThumbnail, setNewMediaIsThumbnail] = useState(false)
    const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false)
    const [isMediaLoading, setIsMediaLoading] = useState(false)
    const [newMediaFile, setNewMediaFile] = useState<File | null>(null); // 👈 State cho file
    // 👈 THÊM STATE ĐỂ LƯU ID CỦA TAG "CLUB" VÀ "EVENT"
    const [fixedTagIds, setFixedTagIds] = useState<FixedTagIds>({
        clubTagId: null,
        eventTagId: null,
    });

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

    // TÁCH HÀM FETCH GỐC 
    // const fetchProductData = useCallback(async (cId: number, pId: string) => {
    //     try {
    //         const [productData, tagsData] = await Promise.all([
    //             getProductById(cId, pId),
    //             getTags()
    //         ])

    //         setProduct(productData)
    //         setAllTags(tagsData)

    //         const loadedTagIds = tagsData
    //             .filter((tag) => productData.tags.includes(tag.name))
    //             .map((tag) => tag.tagId)

    //         setForm({
    //             name: productData.name,
    //             description: productData.description,
    //             pointCost: productData.pointCost,
    //             stockQuantity: productData.stockQuantity,
    //             type: productData.type || "CLUB_ITEM",
    //             eventId: productData.eventId,
    //             tagIds: loadedTagIds,
    //             status: productData.status,
    //         })
    //     } catch (error) {
    //         console.error("Failed to load product details:", error)
    //         toast({
    //             title: "Error",
    //             description: "Unable to load product details.",
    //             variant: "destructive",
    //         })
    //         router.back()
    //     }
    // }, [router, toast]) // Thêm dependencies
    const fetchProductData = useCallback(async (cId: number, pId: string) => {
        try {
            const [productData, tagsData] = await Promise.all([
                getProductById(cId, pId),
                getTags()
            ])

            setProduct(productData)
            setAllTags(tagsData)

            // 👈 THÊM LOGIC: Tìm và lưu các tag cố định
            const clubTag = tagsData.find(tag => tag.name.toLowerCase() === "club");
            const eventTag = tagsData.find(tag => tag.name.toLowerCase() === "event");
            setFixedTagIds({
                clubTagId: clubTag ? clubTag.tagId : null,
                eventTagId: eventTag ? eventTag.tagId : null,
            });

            // --- QUAN TRỌNG: Chuyển đổi dữ liệu cho form ---
            const loadedTagIds = tagsData
                .filter((tag) => productData.tags.includes(tag.name))
                .map((tag) => tag.tagId)

            setForm({
                name: productData.name,
                description: productData.description,
                pointCost: productData.pointCost,
                stockQuantity: productData.stockQuantity,
                type: productData.type || "CLUB_ITEM",
                eventId: productData.eventId,
                tagIds: loadedTagIds,
                status: productData.status,
            })
        } catch (error) {
            console.error("Failed to load product details:", error)
            toast({
                title: "Error",
                description: "Unable to load product details.",
                variant: "destructive",
            })
            router.back()
        }
    }, [router, toast]) // Thêm dependencies

    // 2. Fetch dữ liệu lần đầu
    useEffect(() => {
        if (clubId && productId) {
            setLoading(true)
            fetchProductData(clubId, productId).finally(() => {
                setLoading(false)
            })
        }
    }, [clubId, productId, fetchProductData]) // Thêm fetchProductData



    // 3. Handlers cho form 
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (!form) return

        setForm({
            ...form,
            [name]: name === "pointCost" || name === "stockQuantity" || name === "eventId"
                ? (value === "" ? 0 : Number(value)) // Sửa (default 0)
                : value,
        })
    }

    // const handleSelectChange = (name: string) => (value: string) => {
    //     if (!form) return
    //     setForm({ ...form, [name]: value })
    // }
    const handleSelectChange = (name: string) => (value: string) => {
        if (!form) return;

        // Chỉ xử lý logic đặc biệt khi đổi 'type' (Product Type)
        if (name === "type") {
            const { clubTagId, eventTagId } = fixedTagIds;

            setForm((prev) => {
                if (!prev) return null; // Thêm kiểm tra null

                let newTagIds = [...prev.tagIds];

                // Lọc bỏ cả 2 tag cố định
                newTagIds = newTagIds.filter(id => id !== clubTagId && id !== eventTagId);

                // Thêm tag tương ứng
                if (value === "CLUB_ITEM" && clubTagId) {
                    newTagIds.push(clubTagId);
                } else if (value === "EVENT_ITEM" && eventTagId) {
                    newTagIds.push(eventTagId);
                }

                return { ...prev, [name]: value, tagIds: newTagIds };
            });
        } else {
            // Giữ nguyên logic cũ cho các select khác (vd: status)
            setForm((prev) => (prev ? { ...prev, [name]: value } : null));
        }
    }

    // const handleTagChange = (tagId: number) => (checked: boolean) => {
    //     if (!form) return
    //     const currentTags = form.tagIds || []
    //     let newTagIds: number[]
    //     if (checked) {
    //         newTagIds = [...currentTags, tagId]
    //     } else {
    //         newTagIds = currentTags.filter((id) => id !== tagId)
    //     }
    //     setForm({ ...form, tagIds: newTagIds })
    // }
    // 🛑 CẬP NHẬT: handleTagChange (Không cho phép bỏ chọn tag cố định)
    const handleTagChange = (tagId: number) => (checked: boolean) => {
        if (!form) return;
        const { clubTagId, eventTagId } = fixedTagIds;

        // Nếu tag là tag cố định, không cho làm gì cả
        if (tagId === clubTagId || tagId === eventTagId) {
            return;
        }

        // Logic cũ cho các tag khác
        const currentTags = form.tagIds || []
        let newTagIds: number[]
        if (checked) {
            newTagIds = [...currentTags, tagId]
        } else {
            newTagIds = currentTags.filter((id) => id !== tagId)
        }
        setForm({ ...form, tagIds: newTagIds })
    }


    // // 4. Handler LƯU (ĐÃ CẬP NHẬT và KÍCH HOẠT)
    // const handleSave = async () => {
    //     if (!form || !clubId || !productId) return

    //     setIsSaving(true)
    //     try {
    //         // KÍCH HOẠT: Dùng hàm updateProduct
    //         const updatedProduct = await updateProduct(clubId, productId, form)
    //         // Cập nhật lại state gốc và form
    //         setProduct(updatedProduct)
    //         // Cập nhật lại form state (để đồng bộ nếu có logic nào đó từ server)
    //         const loadedTagIds = allTags
    //             .filter((tag) => updatedProduct.tags.includes(tag.name))
    //             .map((tag) => tag.tagId)
    //         setForm({
    //             name: updatedProduct.name,
    //             description: updatedProduct.description,
    //             pointCost: updatedProduct.pointCost,
    //             stockQuantity: updatedProduct.stockQuantity,
    //             type: updatedProduct.type,
    //             eventId: updatedProduct.eventId,
    //             tagIds: loadedTagIds,
    //             status: updatedProduct.status,
    //         })
    //         toast({
    //             title: "Success",
    //             description: "Product updated successfully.",
    //             variant: "success",
    //         })
    //     } catch (error: any) {
    //         toast({
    //             title: "Error",
    //             description: error.message || "Failed to update product.",
    //             variant: "destructive",
    //         })
    //     } finally {
    //         setIsSaving(false)
    //     }
    // }
    // 5. Handler LƯU (Cập nhật để dùng refetch)
    const handleSave = async () => {
        if (!form || !clubId || !productId) return
        // 👈 KIỂM TRA NGHIỆP VỤ MỚI
        if (!form.tagIds || form.tagIds.length === 0) {
            toast({ title: "Error", description: "Product must have at least one tag.", variant: "destructive" })
            return;
        }

        setIsSaving(true)
        try {
            // Bước 1: Gọi API updateProduct
            await updateProduct(clubId, productId, form)

            // Bước 2: Báo thành công
            toast({
                title: "Success",
                description: "Product updated successfully.",
                variant: "success",
            })

            // Bước 3: Tải lại toàn bộ dữ liệu (an toàn nhất)
            // (refetchProduct đã bao gồm setLoading(true/false) và toast)
            await fetchProductData(clubId, productId); // Gọi trực tiếp để tránh toast "Media updated"

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update product.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    // HÀM TẢI LẠI SẢN PHẨM (Dùng cho Media)
    const refetchProduct = async () => {
        if (!clubId || !productId) return
        try {
            setIsMediaLoading(true) // Chỉ dùng loading của Media
            await fetchProductData(clubId, productId)
            toast({ title: "Success", description: "Media updated.", variant: "success" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to reload product.", variant: "destructive" })
        } finally {
            setIsMediaLoading(false)
        }
    }

    // ❗️ THÊM HÀM MỚI NÀY
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewMediaFile(e.target.files[0]);
        } else {
            setNewMediaFile(null);
        }
    };



    // const handleAddMedia = async () => {
    //     if (!clubId || !productId || !newMediaUrl) {
    //         toast({ title: "Error", description: "URL is required.", variant: "destructive" })
    //         return
    //     }

    //     setIsMediaLoading(true)

    //     // Lấy thumbnail cũ TRƯỚC KHI GỌI API
    //     const oldThumbnail = product?.media.find(m => m.thumbnail);

    //     try {
    //         // Bước 1: Thêm ảnh mới
    //         await addMediaToProduct(clubId, productId, {
    //             urls: [newMediaUrl],
    //             type: "IMAGE",
    //             thumbnail: newMediaIsThumbnail, // Gửi trạng thái thumbnail
    //         })

    //         // Bước 2: Nếu ta vừa set ảnh mới làm thumbnail VÀ có ảnh thumbnail cũ
    //         if (newMediaIsThumbnail && oldThumbnail) {
    //             // ... thì gỡ thumbnail cũ
    //             await updateMedia(clubId, productId, oldThumbnail.mediaId, { thumbnail: false });
    //         }

    //         // Reset state của dialog
    //         setIsMediaDialogOpen(false)
    //         setNewMediaUrl("")
    //         setNewMediaIsThumbnail(false)

    //         await refetchProduct() // Tải lại dữ liệu
    //     } catch (error: any) {
    //         toast({ title: "Error", description: error.message || "Failed to add media.", variant: "destructive" })
    //     } finally {
    //         setIsMediaLoading(false)
    //     }
    // }
    // ❗️ VIẾT LẠI HOÀN TOÀN handleAddMedia
    const handleAddMedia = async () => {
        if (!clubId || !productId || !newMediaFile) {
            toast({
                title: "Error",
                description: "Please select a file to upload.",
                variant: "destructive"
            });
            return;
        }

        setIsMediaLoading(true);

        try {
            // Gọi API mới, chỉ cần truyền File
            await addMediaToProduct(clubId, productId, newMediaFile);

            // Reset state của dialog
            setIsMediaDialogOpen(false);
            setNewMediaFile(null);

            await refetchProduct(); // Tải lại dữ liệu
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add media.",
                variant: "destructive"
            });
        } finally {
            setIsMediaLoading(false);
        }
    }


    const handleDeleteMedia = async (mediaId: number) => {
        if (!clubId || !productId) return
        if (!window.confirm("Are you sure you want to delete this image?")) return

        setIsMediaLoading(true)
        try {
            await deleteMediaFromProduct(clubId, productId, mediaId)
            await refetchProduct() // Tải lại
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete media.", variant: "destructive" })
        } finally {
            setIsMediaLoading(false)
        }
    }

    const handleSetThumbnail = async (newMediaId: number) => {
        if (!clubId || !productId || !product) return

        setIsMediaLoading(true)

        try {
            // Tìm thumbnail cũ
            const oldThumbnail = product.media.find(m => m.thumbnail);

            const operations = [];

            // Thao tác 1: Đặt thumbnail MỚI
            operations.push(
                updateMedia(clubId, productId, newMediaId, { thumbnail: true })
            );

            // Thao tác 2: Gỡ thumbnail CŨ (nếu có)
            if (oldThumbnail) {
                operations.push(
                    updateMedia(clubId, productId, oldThumbnail.mediaId, { thumbnail: false })
                );
            }

            // Chạy song song cả hai
            await Promise.all(operations);

            await refetchProduct() // Tải lại
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to set thumbnail.", variant: "destructive" })
        } finally {
            setIsMediaLoading(false)
        }
    }

    if (loading && !product) { // Chỉ hiển thị skeleton khi tải lần đầu
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
                            <span className="text-sm text-muted-foreground">ID: #{product.id}</span>

                            {/* Nút Save (Đã kích hoạt) */}
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
                                        <Input id="name" className="mt-2 border-slate-300" name="name" value={form.name} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={form.description}
                                            onChange={handleChange}
                                            rows={5}
                                            className="mt-2 border-slate-300"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* CARD IMAGE */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Image</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => setIsMediaDialogOpen(true)}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Add Media
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {isMediaLoading && ( // Hiển thị loading khi đang thao tác media
                                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    )}
                                    {product.media && product.media.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-4">
                                            {product.media.map((m) => (
                                                <div key={m.mediaId} className="relative aspect-square group rounded-md overflow-hidden">
                                                    <img
                                                        src={m.url}
                                                        alt="Product media"
                                                        className="object-cover w-full h-full"
                                                    />
                                                    {/* Overlay khi hover */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleDeleteMedia(m.mediaId)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                        {!m.thumbnail && ( // Chỉ hiển thị nút nếu CHƯA phải là thumbnail
                                                            <Button
                                                                variant="secondary"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleSetThumbnail(m.mediaId)}
                                                            >
                                                                <Star className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {m.thumbnail && (
                                                        <Badge className="absolute top-2 left-2 z-10 border-2 border-yellow-400 text-yellow-400">
                                                            Thumbnail
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">There are no images for this product yet..</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Cột phải: Thông tin phụ */}
                        <div className="md:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="status">Product Status</Label>
                                        <Select
                                            name="status"
                                            value={form.status}
                                            onValueChange={handleSelectChange("status")}
                                        >
                                            <SelectTrigger className="mt-2 border-slate-300">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Active (On sale)</SelectItem>
                                                <SelectItem value="INACTIVE">Inactive (Hidden)</SelectItem>
                                                {/* <SelectItem value="ARCHIVED">Archived</SelectItem> */}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Classify</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="type">Product Type</Label>
                                        <Select
                                            name="type"
                                            value={form.type}
                                            onValueChange={handleSelectChange("type")}
                                        >
                                            <SelectTrigger className="mt-2 border-slate-300">
                                                <SelectValue placeholder="Select product type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CLUB_ITEM">Club Item</SelectItem>
                                                <SelectItem value="EVENT_ITEM">Event Item</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {form.type === "EVENT_ITEM" && (
                                        <div className="space-y-1">
                                            <Label htmlFor="eventId">Event ID</Label>
                                            <Input
                                                id="eventId"
                                                name="eventId"
                                                type="number"
                                                value={form.eventId || 0}
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
                                        <Label htmlFor="pointCost">Price (Points)</Label>
                                        {/* 5. SỬA: Đảm bảo Input name='price' khớp với form state */}
                                        <Input id="pointCost" className="mt-2 border-slate-300" name="pointCost" type="number" value={form.pointCost} onChange={handleChange} min={0} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="stockQuantity">Quantity in stock</Label>
                                        <Input id="stockQuantity" className="mt-2 border-slate-300" name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange} min={0} />
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
                                        className="mb-3 mt-2 border-slate-300" // Thêm khoảng cách
                                    />

                                    {allTags.length > 0 ? (
                                        <ScrollArea className="h-48 rounded-md border p-3 mt-2 border-slate-300">
                                            <div className="space-y-2 ">
                                                {/* {allTags
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
                                                    ))} */}
                                                {allTags
                                                    .filter((tag) =>
                                                        tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
                                                    )
                                                    .map((tag) => {
                                                        // 👈 KIỂM TRA XEM TAG CÓ BỊ VÔ HIỆU HÓA KHÔNG
                                                        const isDisabled =
                                                            tag.tagId === fixedTagIds.clubTagId ||
                                                            tag.tagId === fixedTagIds.eventTagId;

                                                        return (
                                                            <div key={tag.tagId} className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`tag-${tag.tagId}`}
                                                                    checked={form.tagIds.includes(tag.tagId)}
                                                                    onCheckedChange={(checked) => handleTagChange(tag.tagId)(checked as boolean)}
                                                                    disabled={isDisabled} // 👈 THÊM PROP DISABLED
                                                                    aria-label={tag.name}
                                                                />
                                                                <Label
                                                                    htmlFor={`tag-${tag.tagId}`}
                                                                    className={`font-normal ${isDisabled ? 'text-muted-foreground cursor-not-allowed' : ''}`} // 👈 Style cho tag bị disable
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
                                        <p className="text-sm text-muted-foreground">No tags.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        {/* <DialogHeader>
                            <DialogTitle>Add New Media</DialogTitle>
                            <DialogDescription>
                                Paste a URL to an image. The image will be added to the product.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="media-url" className="text-right">
                                    Image URL
                                </Label>
                                <Input
                                    id="media-url"
                                    value={newMediaUrl}
                                    onChange={(e) => setNewMediaUrl(e.target.value)}
                                    className="col-span-3"
                                    placeholder="https://example.com/image.png"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="thumbnail" className="text-right">
                                    Thumbnail
                                </Label>
                                <div className="col-span-3 flex items-center space-x-2">
                                    <Checkbox
                                        id="thumbnail"
                                        checked={newMediaIsThumbnail}
                                        onCheckedChange={(checked) => setNewMediaIsThumbnail(checked as boolean)}
                                    />
                                    <Label
                                        htmlFor="thumbnail"
                                        className="text-sm font-normal text-muted-foreground"
                                    >
                                        Set this image as the product thumbnail (cover image).
                                    </Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setIsMediaDialogOpen(false); // Reset khi cancel
                                setNewMediaUrl("");
                                setNewMediaIsThumbnail(false);
                            }}>Cancel</Button>
                            <Button onClick={handleAddMedia} disabled={isMediaLoading}>
                                {isMediaLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Add Image
                            </Button>
                        </DialogFooter> */}
                        <DialogHeader>
                            <DialogTitle>Add New Media</DialogTitle>
                            <DialogDescription>
                                {/* ❗️ Sửa mô tả */}
                                Choose an image file to upload. It will be added to the product.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="media-file" className="text-right">
                                    Image File
                                </Label>
                                <Input
                                    id="media-file"
                                    type="file" // 👈 Sửa type
                                    accept="image/*" // 👈 Thêm accept
                                    onChange={handleFileChange} // 👈 Sửa onChange
                                    className="col-span-3"
                                />
                            </div>

                            {/* ❗️ Xóa phần Checkbox "Thumbnail" */}
                            {/* API POST mới không hỗ trợ set thumbnail khi upload */}

                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setIsMediaDialogOpen(false); // Reset khi cancel
                                setNewMediaFile(null); // 👈 Sửa
                            }}>Cancel</Button>
                            {/* ❗️ Sửa disable logic */}
                            <Button onClick={handleAddMedia} disabled={isMediaLoading || !newMediaFile}>
                                {isMediaLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Add Image
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AppShell>
        </ProtectedRoute>
    )
}