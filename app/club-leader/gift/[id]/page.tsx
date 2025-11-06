"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
    getProductById, Product, AddProductPayload, updateProduct, UpdateProductPayload, addMediaToProduct, deleteMediaFromProduct,
    setMediaThumbnail, getStockHistory, StockHistory, updateStock,
} from "@/service/productApi"
import { getTags, Tag as ProductTag } from "@/service/tagApi"
import { useToast } from "@/hooks/use-toast"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft, Save, Loader2, Package, DollarSign, Archive, Tag, Image as ImageIcon, CheckCircle, Upload, Trash, Star, History, Plus, XCircle, Video as VideoIcon, Play, Eye
} from "lucide-react"
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
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

type ProductEditForm = UpdateProductPayload
interface FixedTagIds {
    clubTagId: number | null;
    eventTagId: number | null;
}

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const [product, setProduct] = useState<Product | null>(null) // Dữ liệu gốc
    const [form, setForm] = useState<ProductEditForm | null>(null)
    const [allTags, setAllTags] = useState<ProductTag[]>([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [clubId, setClubId] = useState<number | null>(null)
    const productId = params.id as string
    const [tagSearchTerm, setTagSearchTerm] = useState("")
    const [isDeleting, setIsDeleting] = useState(false) // State cho việc xóa
    // STATE MEDIA DIALOG
    const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false)
    const [isMediaLoading, setIsMediaLoading] = useState(false)
    const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
    // STATE ĐỂ LƯU ID CỦA TAG "CLUB" VÀ "EVENT"
    const [fixedTagIds, setFixedTagIds] = useState<FixedTagIds>({
        clubTagId: null,
        eventTagId: null,
    });
    //State cho Dialog Lịch sử
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    // State cho Dialog Nhập kho
    const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
    const [stockChange, setStockChange] = useState<string>("");
    const [stockNote, setStockNote] = useState<string>("");
    const [isStockLoading, setIsStockLoading] = useState(false);
    // STATE ĐỂ HIỂN THỊ GIÁ
    const [displayPrice, setDisplayPrice] = useState<string>("");
    //Biến kiểm tra xem có bị Archived không
    const isArchived = product?.status === "ARCHIVED";
    // STATE CHO MEDIA VIEWER
    const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string } | null>(null);
    // STATE CHO IMAGE CROP
    const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState<string>("");
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        width: 90,
        height: 90,
        x: 5,
        y: 5
    });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);
    const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
    const [originalFileName, setOriginalFileName] = useState<string>("");
    // --- Hàm Helper (Hàm hỗ trợ) ---
    const formatNumber = (num: number | string): string => {
        return Number(num).toLocaleString('en-US');
    };
    const parseFormattedNumber = (str: string): number => {
        return Number(str.replace(/,/g, ''));
    };

    // Crop image utility function with high quality preservation
    const getCroppedImg = useCallback((image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        // Use natural dimensions for high quality output
        const naturalCropWidth = crop.width * scaleX;
        const naturalCropHeight = crop.height * scaleY;
        
        canvas.width = naturalCropWidth;
        canvas.height = naturalCropHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return Promise.reject(new Error('No 2d context'));
        }

        // Enable high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            naturalCropWidth,
            naturalCropHeight,
            0,
            0,
            naturalCropWidth,
            naturalCropHeight
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg', 0.95);
        });
    }, []);

    const handleCropComplete = useCallback(async () => {
        if (!imgRef.current || !completedCrop) {
            toast({
                title: "Error",
                description: "Please select a crop area first",
                variant: "destructive"
            });
            return;
        }

        try {
            const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
            setCroppedImageBlob(croppedBlob);
            
            // Convert blob to file
            const croppedFile = new File([croppedBlob], originalFileName || 'cropped-image.jpg', {
                type: 'image/jpeg',
            });
            
            setNewMediaFile(croppedFile);
            setIsCropDialogOpen(false);
            
            toast({
                title: "Success",
                description: "Image cropped successfully! Click 'Upload' to add it.",
                variant: "success"
            });
        } catch (error) {
            console.error('Error cropping image:', error);
            toast({
                title: "Error",
                description: "Failed to crop image",
                variant: "destructive"
            });
        }
    }, [completedCrop, getCroppedImg, originalFileName, toast]);

    const handleCropCancel = () => {
        setIsCropDialogOpen(false);
        setImageSrc("");
        setCrop({
            unit: '%',
            width: 90,
            height: 90,
            x: 5,
            y: 5
        });
        setCompletedCrop(undefined);
        setCroppedImageBlob(null);
    };

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


    // }, [router, toast]) // Thêm dependencies
    const fetchProductData = useCallback(async (cId: number, pId: string) => {
        try {
            const [productData, tagsData] = await Promise.all([
                getProductById(cId, pId),
                getTags()
            ])

            setProduct(productData)
            setAllTags(tagsData)

            // Tìm và lưu các tag cố định
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

            setDisplayPrice(formatNumber(productData.pointCost));
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

    // HANDLERS CHO FORM
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (!form) return

        // 👈 XỬ LÝ ĐẶC BIỆT CHO "pointCost"
        if (name === "pointCost") {
            // Chỉ cho phép số và dấu phẩy
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue === "") {
                setDisplayPrice("");
                setForm({ ...form, pointCost: 0 });
                return;
            }

            const numberValue = parseInt(numericValue, 10);

            // Cập nhật giá trị hiển thị (có dấu phẩy)
            setDisplayPrice(formatNumber(numberValue));
            // Cập nhật state của form (dạng số)
            setForm({ ...form, pointCost: numberValue });

        } else {
            // Logic cũ cho các trường khác
            setForm({
                ...form,
                [name]: name === "eventId"
                    ? (value === "" ? 0 : Number(value))
                    : value,
            })
        }
    }
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

    // handleTagChange (Không cho phép bỏ chọn tag cố định)
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

    const handleSave = async () => {
        if (!form || !clubId || !productId || !product) return // Thêm !product

        if (product.status === "ARCHIVED") {
            toast({
                title: "Error",
                description: "Cannot edit products that are in ARCHIVED status",
                variant: "destructive",
            })
            return; // Dừng hàm
        }

        if (!form.tagIds || form.tagIds.length === 0) {
            toast({ title: "Error", description: "Product must have at least one tag.", variant: "destructive" })
            return;
        }

        setIsSaving(true)
        try {
            await updateProduct(clubId, productId, form);

            toast({
                title: "Success",
                description: "Product updated successfully.",
                variant: "success",
            })

            // Bước 3: Tải lại dữ liệu
            await fetchProductData(clubId, productId);
        } catch (error: any) {
            toast({
                title: "Error",
                description: (error as any).response?.data?.message || error.message || "Failed to update product.",
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setOriginalFileName(file.name);
            
            // Check if it's an image
            if (file.type.startsWith('image/')) {
                // Open crop modal for images
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    setImageSrc(reader.result?.toString() || '');
                    setIsCropDialogOpen(true);
                });
                reader.readAsDataURL(file);
            } else {
                // For videos, use directly without cropping
                setNewMediaFile(file);
            }
        } else {
            setNewMediaFile(null);
        }
    };

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

        // Kiểm tra xem đã là thumbnail chưa
        const currentMedia = product.media.find(m => m.mediaId === newMediaId);
        if (currentMedia && currentMedia.thumbnail) {
            toast({ title: "Info", description: "This is already the thumbnail." });
            return; // Không làm gì cả
        }

        setIsMediaLoading(true)

        try {
            // Chỉ cần gọi API mới
            // Backend sẽ tự động gỡ thumbnail cũ (theo Swagger)
            await setMediaThumbnail(clubId, productId, newMediaId);

            await refetchProduct() // Tải lại để cập nhật UI

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to set thumbnail.",
                variant: "destructive"
            })
        } finally {
            setIsMediaLoading(false)
        }
    }

    // Handler cho Nhập kho
    const handleUpdateStock = async () => {
        if (!clubId || !productId) return;
        // SỬ DỤNG HÀM PARSE MỚI
        const delta = parseFormattedNumber(stockChange);

        if (isNaN(delta) || delta === 0) {
            toast({ title: "Error", description: "Please enter a valid number to add or remove stock (e.g. 50 or -10).", variant: "destructive" });
            return;
        }
        if (!stockNote.trim()) {
            toast({ title: "Error", description: "Please provide a note for this stock change.", variant: "destructive" });
            return;
        }

        setIsStockLoading(true);
        try {
            // Gọi API (API 'updateStock' vẫn nhận 'delta' là number)
            await updateStock(clubId, productId, delta, stockNote);

            toast({ title: "Success", description: "Stock updated successfully!" });

            // Đóng dialog và reset
            setIsStockDialogOpen(false);
            setStockChange(""); // Reset về rỗng
            setStockNote("");

            await fetchProductData(clubId, productId);
            queryClient.invalidateQueries({ queryKey: ['stockHistory', clubId, productId] });

        } catch (error: any) {
            toast({
                title: "Error",
                description: (error as any).response?.data?.message || error.message || "Failed to update stock.",
                variant: "destructive"
            });
        } finally {
            setIsStockLoading(false);
        }
    }

    // Hook fetch Lịch sử Tồn kho
    const {
        data: stockHistory = [],
        isLoading: historyLoading,
    } = useQuery<StockHistory[], Error>({
        queryKey: ['stockHistory', clubId, productId],
        queryFn: () => getStockHistory(clubId!, productId),
        // Chỉ fetch khi dialog được mở
        enabled: !!clubId && !!productId && isHistoryOpen,
        staleTime: 1000, // Luôn lấy dữ liệu mới khi mở dialog
    });

    const handleDeleteProduct = async () => {
        if (!form || !clubId || !productId) return;

        setIsDeleting(true);
        try {
            // Gọi API updateProduct, nhưng GHI ĐÈ status thành "ARCHIVED"
            await updateProduct(clubId, productId, {
                ...form, // Gửi tất cả dữ liệu form hiện tại
                status: "ARCHIVED", // Ghi đè trạng thái
            });

            toast({
                title: "Product Archived",
                description: "The product has been successfully archived.",
                variant: "success",
            });

            // Chuyển hướng về trang danh sách
            router.push('/club-leader/gift');

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to archive product.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
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
                <div className="space-y-8">
                    {/* Enhanced Header */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-100">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="outline" 
                                onClick={() => router.back()}
                                className="hover:bg-white transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Products
                            </Button>
                            <Separator orientation="vertical" className="h-8" />
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Edit Product
                                </h1>
                                <span className="text-sm text-muted-foreground">Product ID: #{product.id}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* --- Logic MỚI: Chỉ hiển thị MỘT trong hai --- */}

                            {isArchived ? (
                                // 1. NẾU ĐÃ ARCHIVED: Hiển thị Badge
                                <Badge variant="destructive" className="text-base py-2 px-4 shadow-lg">
                                    <Archive className="h-5 w-5 mr-2" />
                                    Archived Product
                                </Badge>
                            ) : (
                                // 2. NẾU CHƯA ARCHIVED: Hiển thị nút Archive
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                            disabled={isSaving || isDeleting}
                                        >
                                            <Trash className="h-4 w-4 mr-2" />
                                            Archive Product
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="max-w-lg">
                                        <AlertDialogHeader>
                                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-4 shadow-lg">
                                                <Archive className="h-10 w-10 text-red-600" />
                                            </div>
                                            <AlertDialogTitle className="text-center text-2xl font-bold text-gray-900">
                                                Archive Product?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-center text-base space-y-4 pt-2">
                                                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                                                    <p className="text-gray-700 font-medium mb-2">
                                                        "{product?.name}"
                                                    </p>
                                                    <p className="text-gray-600 text-sm">
                                                        will be permanently archived and:
                                                    </p>
                                                </div>
                                                
                                                <div className="space-y-2 text-left">
                                                    <div className="flex items-start gap-3 text-gray-700">
                                                        <div className="bg-red-100 p-1 rounded mt-0.5">
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        </div>
                                                        <span className="text-sm">Hidden from all students</span>
                                                    </div>
                                                    <div className="flex items-start gap-3 text-gray-700">
                                                        <div className="bg-red-100 p-1 rounded mt-0.5">
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        </div>
                                                        <span className="text-sm">Cannot be redeemed or purchased</span>
                                                    </div>
                                                    <div className="flex items-start gap-3 text-gray-700">
                                                        <div className="bg-red-100 p-1 rounded mt-0.5">
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        </div>
                                                        <span className="text-sm">Cannot be edited or restored</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3 mt-4">
                                                    <p className="text-amber-900 text-sm font-bold flex items-center gap-2">
                                                        <span className="text-lg">⚠️</span>
                                                        This action is permanent and cannot be undone!
                                                    </p>
                                                </div>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="flex gap-3 mt-2">
                                            <AlertDialogCancel 
                                                disabled={isDeleting} 
                                                className="flex-1 h-11 border-2 hover:bg-gray-100"
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                className="flex-1 h-11 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg"
                                                onClick={handleDeleteProduct}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Archiving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Archive className="h-4 w-4 mr-2" />
                                                        Yes, Archive Product
                                                    </>
                                                )}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            {/* Nút Save (Disabled nếu đã Archived) */}
                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving || isDeleting || isArchived}
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Cột trái: Thông tin chính */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-600 p-2 rounded-lg">
                                            <Package className="h-5 w-5 text-white" />
                                        </div>
                                        <CardTitle className="text-xl">Product Details</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-base font-semibold">
                                            Product Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input 
                                            id="name" 
                                            className="h-11 border-2 focus:border-blue-500" 
                                            name="name" 
                                            value={form.name} 
                                            onChange={handleChange}
                                            placeholder="Enter product name"
                                            disabled={isArchived}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-base font-semibold">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={form.description}
                                            onChange={handleChange}
                                            rows={6}
                                            className="border-2 focus:border-blue-500 resize-none"
                                            placeholder="Enter a detailed description of your product..."
                                            disabled={isArchived}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* CARD IMAGE */}
                            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-white border-b-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-purple-600 p-2 rounded-lg">
                                            <ImageIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <CardTitle className="text-xl">Product Images</CardTitle>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setIsMediaDialogOpen(true)}
                                        disabled={isArchived}
                                        className="border-2 hover:bg-purple-50 hover:border-purple-300"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Media
                                    </Button>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {isMediaLoading && ( // Hiển thị loading khi đang thao tác media
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20 rounded-lg backdrop-blur-sm">
                                            <div className="text-center">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-600" />
                                                <p className="text-sm text-muted-foreground">Processing...</p>
                                            </div>
                                        </div>
                                    )}
                                    {product.media && product.media.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-4">
                                            {product.media.map((m) => (
                                                <div key={m.mediaId} className="relative aspect-square group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-300 transition-all">
                                                    {/* Render video or image based on type */}
                                                    {m.type === "VIDEO" ? (
                                                        <video
                                                            src={m.url}
                                                            controls
                                                            className="object-cover w-full h-full"
                                                        >
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    ) : (
                                                        <img
                                                            src={m.url}
                                                            alt="Product media"
                                                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                                                        />
                                                    )}
                                                    
                                                    {/* Media Type Badge */}
                                                    <Badge className={`absolute top-3 right-3 z-10 ${m.type === "VIDEO" ? "bg-purple-500 text-white" : "bg-blue-500 text-white"} border-0 shadow-lg`}>
                                                        {m.type === "VIDEO" ? (
                                                            <>
                                                                <VideoIcon className="h-3 w-3 mr-1" />
                                                                Video
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ImageIcon className="h-3 w-3 mr-1" />
                                                                Image
                                                            </>
                                                        )}
                                                    </Badge>
                                                    
                                                    {/* Overlay khi hover */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                                                        <Button
                                                            variant="secondary" 
                                                            size="icon" 
                                                            className="h-10 w-10 shadow-lg hover:scale-110 transition-transform bg-blue-500 hover:bg-blue-600"
                                                            onClick={(e) => { 
                                                                e.preventDefault(); 
                                                                setSelectedMedia({ url: m.url, type: m.type });
                                                                setIsMediaViewerOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-5 w-5 text-white" />
                                                        </Button>
                                                        {!isArchived && (
                                                            <>
                                                                <Button
                                                                    variant="destructive" 
                                                                    size="icon" 
                                                                    className="h-10 w-10 shadow-lg hover:scale-110 transition-transform"
                                                                    onClick={(e) => { e.preventDefault(); handleDeleteMedia(m.mediaId) }}
                                                                >
                                                                    <Trash className="h-5 w-5" />
                                                                </Button>
                                                                {!m.thumbnail && (
                                                                    <Button
                                                                        variant="secondary" 
                                                                        size="icon" 
                                                                        className="h-10 w-10 shadow-lg hover:scale-110 transition-transform bg-yellow-400 hover:bg-yellow-500"
                                                                        onClick={(e) => { e.preventDefault(); handleSetThumbnail(m.mediaId) }}
                                                                    >
                                                                        <Star className="h-5 w-5 text-yellow-900" />
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                    {m.thumbnail && (
                                                        <Badge className="absolute top-3 left-3 z-10 bg-yellow-400 text-yellow-900 border-2 border-yellow-300 shadow-lg">
                                                            <Star className="h-3 w-3 mr-1 fill-yellow-900" />
                                                            Thumbnail
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-muted-foreground font-medium">No media uploaded yet</p>
                                            <p className="text-sm text-muted-foreground mt-1">Click "Upload Image" to add product photos or videos</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Cột phải: Thông tin phụ */}
                        <div className="md:col-span-1 space-y-6">
                            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-green-600 p-2 rounded-lg">
                                            <CheckCircle className="h-5 w-5 text-white" />
                                        </div>
                                        <CardTitle className="text-xl">Status</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="space-y-2">
                                        <Label className="text-base font-semibold">Product Status</Label>
                                        {isArchived ? (
                                            // Nếu đã Archived: Hiển thị Badge
                                            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                                                <Badge variant="destructive" className="text-base w-full justify-center py-2">
                                                    <Archive className="h-4 w-4 mr-2" />
                                                    Archived
                                                </Badge>
                                            </div>
                                        ) : (
                                            <Select
                                                name="status"
                                                value={form.status}
                                                onValueChange={handleSelectChange("status")}
                                                disabled={isArchived}
                                            >
                                                <SelectTrigger className="h-11 border-2 focus:border-green-500">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                            Active (On sale)
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="INACTIVE">
                                                        <div className="flex items-center gap-2">
                                                            <XCircle className="h-4 w-4 text-gray-600" />
                                                            Inactive (Hidden)
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-orange-600 p-2 rounded-lg">
                                            <Tag className="h-5 w-5 text-white" />
                                        </div>
                                        <CardTitle className="text-xl">Classification</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="type" className="text-base font-semibold">Product Type</Label>
                                        <Select
                                            name="type"
                                            value={form.type}
                                            onValueChange={handleSelectChange("type")}
                                            disabled={isArchived}
                                        >
                                            <SelectTrigger className="h-11 border-2 focus:border-orange-500">
                                                <SelectValue placeholder="Select product type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CLUB_ITEM">Club Item</SelectItem>
                                                <SelectItem value="EVENT_ITEM">Event Item</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {form.type === "EVENT_ITEM" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="eventId" className="text-base font-semibold">Event ID</Label>
                                            <Input
                                                id="eventId"
                                                className="h-11 border-2 focus:border-orange-500"
                                                name="eventId"
                                                type="number"
                                                value={form.eventId || 0}
                                                onChange={handleChange}
                                                min={1}
                                                disabled={isArchived}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* CARD PRICE & INVENTORY */}
                            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-indigo-600 p-2 rounded-lg">
                                                <DollarSign className="h-5 w-5 text-white" />
                                            </div>
                                            <CardTitle className="text-xl">Price & Stock</CardTitle>
                                        </div>
                                        {/* Cụm nút */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsHistoryOpen(true)}
                                                disabled={isArchived}
                                                className="h-9 w-9 p-0 border-2 hover:bg-indigo-50"
                                                title="View Stock History"
                                            >
                                                <History className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsStockDialogOpen(true)}
                                                disabled={isArchived}
                                                className="h-9 w-9 p-0 border-2 hover:bg-indigo-50"
                                                title="Update Stock"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="pointCost" className="text-base font-semibold">
                                            Price (Points) <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="pointCost"
                                            className="h-11 border-2 focus:border-indigo-500"
                                            name="pointCost"
                                            type="text"
                                            inputMode="numeric"
                                            value={displayPrice}
                                            onChange={handleChange}
                                            disabled={isArchived}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="stockQuantity" className="text-base font-semibold">Current Stock</Label>
                                            {form.stockQuantity === 0 && (
                                                <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="stockQuantity"
                                                className="h-11 border-2 bg-gray-50 text-gray-600 font-semibold text-lg"
                                                name="stockQuantity"
                                                type="number"
                                                value={form.stockQuantity}
                                                onChange={() => { }}
                                                min={0}
                                                disabled
                                                readOnly
                                            />
                                            <Package className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Use the + button to update stock</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-pink-50 to-white border-b-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-pink-600 p-2 rounded-lg">
                                            <Tag className="h-5 w-5 text-white" />
                                        </div>
                                        <CardTitle className="text-xl">Product Tags</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <Input
                                        placeholder="Search tags..."
                                        value={tagSearchTerm}
                                        onChange={(e) => setTagSearchTerm(e.target.value)}
                                        className="mb-4 h-10 border-2 focus:border-pink-500"
                                        disabled={isArchived}
                                    />

                                    {allTags.length > 0 ? (
                                        <ScrollArea className="h-52 rounded-lg border-2 p-4 bg-gray-50">
                                            <div className="space-y-3">
                                                {allTags
                                                    .filter((tag) =>
                                                        tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
                                                    )
                                                    .map((tag) => {
                                                        // KIỂM TRA XEM TAG CÓ BỊ VÔ HIỆU HÓA KHÔNG
                                                        const isCoreTag =
                                                            tag.tagId === fixedTagIds.clubTagId ||
                                                            tag.tagId === fixedTagIds.eventTagId;

                                                        // Bị disable nếu là Core Tag HOẶC sản phẩm đã archived
                                                        const isDisabled = isCoreTag || isArchived;

                                                        return (
                                                            <div key={tag.tagId} className="flex items-center space-x-3 p-2 rounded-md hover:bg-white transition-colors">
                                                                <Checkbox
                                                                    id={`tag-${tag.tagId}`}
                                                                    checked={form.tagIds.includes(tag.tagId)}
                                                                    onCheckedChange={(checked) => handleTagChange(tag.tagId)(checked as boolean)}
                                                                    disabled={isDisabled}
                                                                    aria-label={tag.name}
                                                                    className="h-5 w-5"
                                                                />
                                                                <Label
                                                                    htmlFor={`tag-${tag.tagId}`}
                                                                    className={`font-medium flex-1 cursor-pointer ${isDisabled ? 'text-muted-foreground' : ''}`}
                                                                >
                                                                    {tag.name}
                                                                    {isCoreTag && (
                                                                        <Badge variant="outline" className="ml-2 text-xs">Auto</Badge>
                                                                    )}
                                                                </Label>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </ScrollArea>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                                            <Tag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">No tags available</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <Upload className="h-8 w-8 text-purple-600" />
                            </div>
                            <DialogTitle className="text-center text-2xl">Upload Product Media</DialogTitle>
                            <DialogDescription className="text-center">
                                Choose an image or video file to add to your product gallery.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="media-file" className="text-base font-semibold">
                                    Select File
                                </Label>
                                <Input
                                    id="media-file"
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileChange}
                                    className="border-2 focus:border-purple-500 cursor-pointer"
                                />
                                {newMediaFile && (
                                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                        {newMediaFile.type.startsWith('video/') ? (
                                            <VideoIcon className="h-5 w-5 text-purple-600" />
                                        ) : (
                                            <ImageIcon className="h-5 w-5 text-purple-600" />
                                        )}
                                        <span className="text-sm font-medium text-purple-900 truncate flex-1">
                                            {newMediaFile.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setIsMediaDialogOpen(false);
                                    setNewMediaFile(null);
                                }}
                                className="flex-1"
                                disabled={isMediaLoading}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleAddMedia} 
                                disabled={isMediaLoading || !newMediaFile}
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                            >
                                {isMediaLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog Lịch sử Tồn kho */}
                <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                    <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-indigo-100 p-2 rounded-lg">
                                    <History className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl">Stock History</DialogTitle>
                                    <DialogDescription className="text-base">
                                        {product.name}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        {/* Thêm flex-1 và overflow-hidden để ScrollArea hoạt động */}
                        <div className="flex-1 overflow-hidden border-2 rounded-lg">
                            <ScrollArea className="h-full">
                                <div className="p-4">
                                    {historyLoading ? (
                                        <div className="space-y-3 py-4">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    ) : stockHistory.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <History className="h-10 w-10 text-gray-400" />
                                            </div>
                                            <p className="text-base text-muted-foreground font-medium">
                                                No stock history found
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Stock changes will appear here
                                            </p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="w-[200px] font-bold">Date & Time</TableHead>
                                                    <TableHead className="text-center font-bold">Change</TableHead>
                                                    <TableHead className="text-center font-bold">New Stock</TableHead>
                                                    <TableHead className="font-bold">Note</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {stockHistory.map((entry) => {
                                                    const change = entry.newStock - entry.oldStock;
                                                    const changeColor = change > 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
                                                    const changeSign = change > 0 ? "+" : "";

                                                    return (
                                                        <TableRow key={entry.id} className="hover:bg-gray-50">
                                                            <TableCell className="text-sm whitespace-nowrap font-medium">
                                                                {new Date(entry.changedAt).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge className={`${changeColor} font-bold text-base px-3 py-1`}>
                                                                    {changeSign}{change}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <span className="font-bold text-lg">{entry.newStock}</span>
                                                            </TableCell>
                                                            <TableCell className="text-sm">{entry.note || "N/A"}</TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                        <DialogFooter>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsHistoryOpen(false)}
                                className="w-full sm:w-auto"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dialog Thêm hàng hóa */}
                <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                                <Package className="h-8 w-8 text-indigo-600" />
                            </div>
                            <DialogTitle className="text-center text-2xl">Update Stock</DialogTitle>
                            <DialogDescription className="text-center">
                                Add or remove stock. Use a negative number to remove items.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="stockChange" className="text-base font-semibold">
                                    Stock Change <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="stockChange"
                                    type="text"
                                    inputMode="numeric"
                                    value={stockChange}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Cho phép dấu âm chỉ ở đầu
                                        const isNegative = value.startsWith('-');
                                        // Chỉ lấy số
                                        const numericValue = value.replace(/[^0-9]/g, '');

                                        if (numericValue === "") {
                                            // Cho phép người dùng gõ dấu "-"
                                            setStockChange(isNegative ? "-" : "");
                                            return;
                                        }

                                        const numberValue = parseInt(numericValue, 10);
                                        const formattedValue = formatNumber(numberValue);

                                        // Set lại giá trị (có dấu phẩy và dấu âm)
                                        setStockChange(isNegative ? `-${formattedValue}` : formattedValue);
                                    }}
                                    placeholder="e.g., 50 (to add) or -10 (to remove)"
                                    className="h-12 border-2 focus:border-indigo-500 text-lg"
                                />
                                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="bg-blue-100 p-1 rounded">
                                        <CheckCircle className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="text-xs text-blue-900">
                                        <p className="font-semibold mb-1">Examples:</p>
                                        <p>• Type <span className="font-bold">50</span> to add 50 items</p>
                                        <p>• Type <span className="font-bold">-10</span> to remove 10 items</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stockNote" className="text-base font-semibold">
                                    Note <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="stockNote"
                                    value={stockNote}
                                    onChange={(e) => setStockNote(e.target.value)}
                                    placeholder="e.g., 'Initial stock import' or 'Manual correction'"
                                    className="border-2 focus:border-indigo-500 resize-none"
                                    rows={4}
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsStockDialogOpen(false);
                                    setStockChange("");
                                    setStockNote("");
                                }}
                                disabled={isStockLoading}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateStock}
                                disabled={isStockLoading || parseFormattedNumber(stockChange) === 0 || !stockNote.trim()}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isStockLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Confirm Update
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Image Crop Dialog */}
                <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
                    <DialogContent className="max-w-[90vw] w-[90vw] max-h-[95vh] overflow-auto">
                        <DialogHeader>
                            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <ImageIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <DialogTitle className="text-center text-2xl">Crop Image</DialogTitle>
                            <DialogDescription className="text-center">
                                Drag and resize the selection to crop your image
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 px-6">
                            <div className="border-2 border-gray-200 rounded-lg p-8 bg-gray-50 w-full">
                                <div className="flex justify-center w-full">
                                    {imageSrc && (
                                        <ReactCrop
                                            crop={crop}
                                            onChange={(c) => setCrop(c)}
                                            onComplete={(c) => setCompletedCrop(c)}
                                            aspect={undefined}
                                            className="max-h-[75vh] w-full"
                                            style={{ maxWidth: '100%' }}
                                        >
                                            <img
                                                ref={imgRef}
                                                alt="Crop preview"
                                                src={imageSrc}
                                                style={{ maxHeight: '75vh', width: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                            />
                                        </ReactCrop>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCropCancel}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCropComplete}
                                disabled={!completedCrop}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Apply Crop
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Media Viewer Dialog */}
                <Dialog open={isMediaViewerOpen} onOpenChange={setIsMediaViewerOpen}>
                    <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-0">
                            <DialogTitle className="flex items-center gap-2">
                                {selectedMedia?.type === "VIDEO" ? (
                                    <>
                                        <VideoIcon className="h-5 w-5 text-purple-600" />
                                        Video Preview
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="h-5 w-5 text-blue-600" />
                                        Image Preview
                                    </>
                                )}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-center p-6 pt-4 bg-gray-100">
                            {selectedMedia?.type === "VIDEO" ? (
                                <video
                                    src={selectedMedia.url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[70vh] rounded-lg shadow-2xl"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <img
                                    src={selectedMedia?.url}
                                    alt="Full size preview"
                                    className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain"
                                />
                            )}
                        </div>
                        <DialogFooter className="p-6 pt-0">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsMediaViewerOpen(false);
                                    setSelectedMedia(null);
                                }}
                                className="w-full"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </AppShell>
        </ProtectedRoute>
    )
}