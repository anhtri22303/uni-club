"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { getProductById, Product, } from "@/service/productApi"
import { redeemClubProduct, redeemEventProduct, RedeemPayload, } from "@/service/redeemApi"
import { useToast } from "@/hooks/use-toast"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Loader2, Package, DollarSign, Tag, Info, ShoppingCart, AlertCircle, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-label"
import { useQueryClient } from "@tanstack/react-query"
import { useProfile, queryKeys } from "@/hooks/use-query-hooks"

export default function StudentProductViewPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [isRedeeming, setIsRedeeming] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const [quantity, setQuantity] = useState(1)
    const queryClient = useQueryClient()
    const productId = params.id as string
    const { data: profile, isLoading: profileLoading } = useProfile(true)
    const searchParams = useSearchParams()
    const clubIdFromQuery = searchParams.get('clubId')

    const fetchProduct = useCallback(async () => {
        // Chờ cả productId VÀ clubIdFromQuery
        if (!productId || !clubIdFromQuery) {
            console.warn("Đang chờ productId hoặc clubIdFromQuery...");
            return;
        }

        setLoading(true)
        try {
            //  Chuyển đổi clubIdFromQuery (string) thành số (number)
            const numericClubId = Number(clubIdFromQuery);

            // Kiểm tra xem việc chuyển đổi có thành công không
            if (isNaN(numericClubId)) {
                throw new Error("Invalid Club ID in URL.");
            }
            // Sử dụng clubIdFromQuery (từ URL) để fetch
            const productData = await getProductById(numericClubId, productId)
            setProduct(productData)

            const thumbnail = productData.media.find((m) => m.thumbnail)
            setSelectedImage(thumbnail ? thumbnail.url : productData.media[0]?.url)

        } catch (error) {
            console.error("Failed to load product details:", error)
            toast({
                title: "Error",
                description: "Unable to load product details.",
                variant: "destructive",
            })
            router.back() // Quay lại (an toàn)
        } finally {
            setLoading(false)
        }
        //  Thêm clubIdFromQuery vào dependencies
    }, [productId, clubIdFromQuery, router, toast])

    //  Sửa useEffect để lắng nghe clubIdFromQuery
    useEffect(() => {
        // Chỉ chạy khi clubIdFromQuery đã sẵn sàng
        if (clubIdFromQuery) {
            fetchProduct()
        }
    }, [fetchProduct, clubIdFromQuery]) // 👈 Thêm clubIdFromQuery

    // SỬA LẠI useMemo
    const currentMembership = useMemo(() => {
        // Chờ product VÀ profile (profile là MẢNG)
        if (!product || !profile) {
            console.log("Đang chờ dữ liệu sản phẩm hoặc profile...");
            return null;
        }

        console.log("ĐANG KIỂM TRA MEMBERSHIP:");
        console.log("Sản phẩm này thuộc clubId:", product.clubId);
        // : profile chính là mảng memberships (từ getMyClubs)
        console.log("Tất cả memberships của bạn (từ profile):", profile);

        //  Tìm trực tiếp trên mảng `profile`
        const foundMembership = profile.find((membership: any) => membership.clubId === product.clubId);

        if (!foundMembership) {
            console.error(`%c[LỖI LOGIC] Bạn không phải là thành viên của clubId: ${product.clubId}`, 'color: red; font-weight: bold;');
            return null; // Trả về null -> sẽ hiển thị thông báo "You must be a member..."
        }

        // (Logic kiểm tra membershipId đã đúng)
        if (!foundMembership.membershipId) {
            console.error(`%c[LỖI API] Dữ liệu 'profile' BỊ THIẾU 'membershipId' cho club ${product.clubId}!`, 'color: orange; font-weight: bold;');
        } else {
            console.log(`%c[THÀNH CÔNG] Đã tìm thấy membership:`, 'color: green;', foundMembership);
        }

        return foundMembership;
    }, [product, profile]);

    // Sắp xếp lại mảng media
    const sortedMedia = useMemo(() => {
        if (!product || !product.media) return [];

        // Tạo một bản sao để sắp xếp
        const mediaArray = [...product.media];

        // Sắp xếp: ảnh thumbnail = true sẽ lên đầu
        return mediaArray.sort((a, b) => {
            if (a.thumbnail && !b.thumbnail) return -1; // a lên trước
            if (!a.thumbnail && b.thumbnail) return 1;  // b lên trước
            return 0; // Giữ nguyên thứ tự
        });
    }, [product]);

    // Hàm xử lý chuyển ảnh
    const handleImageNavigation = (direction: 'next' | 'prev') => {
        if (!selectedImage || sortedMedia.length <= 1) return;

        // Tìm vị trí (index) của ảnh đang được chọn
        const currentIndex = sortedMedia.findIndex(m => m.url === selectedImage);
        if (currentIndex === -1) return; // Không tìm thấy (sẽ không xảy ra)

        let nextIndex;
        if (direction === 'next') {
            // Lấy ảnh tiếp theo, nếu là ảnh cuối thì quay về 0 (loop)
            nextIndex = (currentIndex + 1) % sortedMedia.length;
        } else {
            // Lấy ảnh trước đó, nếu là ảnh đầu (0) thì quay về cuối (loop)
            nextIndex = (currentIndex - 1 + sortedMedia.length) % sortedMedia.length;
        }

        // Cập nhật ảnh được chọn
        setSelectedImage(sortedMedia[nextIndex].url);
    };

    const handleQuantityChange = (amount: number) => {
        setQuantity((prev) => {
            const newQuantity = prev + amount;
            if (newQuantity < 1) return 1; // Tối thiểu là 1
            if (product && newQuantity > product.stockQuantity) {
                toast({
                    title: "Warning",
                    description: "Quantity cannot exceed stock.",
                    variant: "default",
                })
                return product.stockQuantity; // Tối đa là tồn kho
            }
            return newQuantity;
        });
    }

    const handleRedeem = async () => {
        // Cần product và currentMembership (thay vì currentWallet)
        if (!product || !currentMembership) {
            toast({
                title: "Error",
                description: "Cannot redeem. Product or membership data is missing.",
                variant: "destructive",
            })
            return;
        }

        if (!currentMembership.membershipId) {
            toast({
                title: "Error",
                description: "Membership ID not found. Cannot redeem.",
                variant: "destructive",
            })
            return;
        }

        setIsRedeeming(true)
        const payload: RedeemPayload = {
            productId: product.id,
            quantity: quantity,
            membershipId: currentMembership.membershipId // Lấy ID từ membership
        }

        try {
            let redeemedOrder;
            if (product.type === "EVENT_ITEM" && product.eventId) {
                redeemedOrder = await redeemEventProduct(product.eventId, payload);
            }
            else if (product.type === "CLUB_ITEM") {
                redeemedOrder = await redeemClubProduct(product.clubId, payload);
            }
            else {
                throw new Error("Invalid product data. Cannot determine redeem endpoint.");
            }

            toast({
                title: "Success",
                description: `You have successfully redeemed ${redeemedOrder.quantity} x ${redeemedOrder.productName}.`,
                variant: "success",
            })
            setIsConfirmOpen(false)
            setQuantity(1);
            queryClient.invalidateQueries({ queryKey: queryKeys.profile });
            await fetchProduct()

        } catch (error: any) {
            toast({
                title: "Redemption Failed",
                description: error.message || "Not enough points or product is out of stock.",
                variant: "destructive",
            })
        } finally {
            setIsRedeeming(false)
        }
    }

    // --- RENDER ---
    //  Thêm `profileLoading` vào logic skeleton
    if ((loading && !product) || profileLoading) {
        return (
            <ProtectedRoute allowedRoles={["student"]}>
                <AppShell>
                    <LoadingSkeleton className="h-[600px]" />
                </AppShell>
            </ProtectedRoute>
        )
    }

    if (!product) {
        return (
            <ProtectedRoute allowedRoles={["student"]}>
                <AppShell>
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <Card className="mt-4">
                        <CardContent className="py-12 text-center">
                            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                            <h3 className="text-lg font-semibold mt-4">Product Not Found</h3>
                            <p className="text-muted-foreground">This product may have been removed or is unavailable.</p>
                        </CardContent>
                    </Card>
                </AppShell>
            </ProtectedRoute>
        )
    }

    const isAvailable = product.status === "ACTIVE" && product.stockQuantity > 0;
    const canRedeem = isAvailable && currentMembership != null && !profileLoading;

    // Tạo hàm quay lại (Back)
    const handleBack = () => {
        if (clubIdFromQuery) {
            // Nếu có clubId, quay về trang gift VỚI clubId đó
            router.push(`/student/gift?clubId=${clubIdFromQuery}`);
        } else {
            // Nếu không (ví dụ: vào từ bookmark), quay về trang gift cơ bản
            router.push('/student/gift');
        }
    }

    return (
        <ProtectedRoute allowedRoles={["student"]}>
            <AppShell>
                <div className="space-y-4">
                    {/* Nút Back */}
                    <div>
                        <Button variant="ghost" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Gift Shop
                        </Button>
                    </div>

                    {/* Layout chính: 2 cột */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                        {/* CỘT TRÁI: HÌNH ẢNH */}
                        <div className="space-y-4">
                            <Card className="overflow-hidden">
                                <CardContent className="p-0">
                                    {/* 'relative group' */}
                                    <div className="aspect-square bg-muted flex items-center justify-center relative group">
                                        {selectedImage ? (
                                            <img
                                                src={selectedImage}
                                                alt={product.name}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <Package className="h-24 w-24 text-muted-foreground" />
                                        )}

                                        {/* NÚT CAROUSEL */}
                                        {sortedMedia.length > 1 && (
                                            <>
                                                {/* Nút Previous */}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleImageNavigation('prev')}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                {/* Nút Next */}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleImageNavigation('next')}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ❗️ SỬ DỤNG `sortedMedia` ĐỂ MAP */}
                            {sortedMedia.length > 1 && (
                                <div className="grid grid-cols-5 gap-2">
                                    {sortedMedia.map((m) => (
                                        <button
                                            key={m.mediaId}
                                            className={`aspect-square rounded-md overflow-hidden border-2 ${selectedImage === m.url ? 'border-primary' : 'border-transparent'}`}
                                            onClick={() => setSelectedImage(m.url)}
                                        >
                                            <img
                                                src={m.url}
                                                alt="Product thumbnail"
                                                className="object-cover w-full h-full"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                        </div>

                        {/* CỘT PHẢI: THÔNG TIN & HÀNH ĐỘNG */}
                        <div className="space-y-6">
                            {/* Tên sản phẩm */}
                            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

                            {/* Giá và Tồn kho */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="text-3xl font-bold text-primary flex items-center gap-2">
                                    <DollarSign className="h-7 w-7" />
                                    <span>{product.pointCost} Points</span>
                                </div>

                                <Badge variant={isAvailable ? "default" : "destructive"} className="text-sm px-4 py-1">
                                    <Package className="h-4 w-4 mr-2" />
                                    {isAvailable ? `${product.stockQuantity} in stock` : "Out of Stock"}
                                </Badge>
                            </div>

                            {/* Nút Đổi quà & Chọn số lượng */}
                            <Card className="bg-muted/30">
                                <CardContent className="p-4 space-y-4">
                                    {/*  Bộ chọn số lượng */}
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity">Quantity</Label>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleQuantityChange(-1)}
                                                disabled={quantity <= 1 || !canRedeem}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                value={quantity}
                                                readOnly
                                                className="w-16 text-center"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleQuantityChange(1)}
                                                disabled={quantity >= product.stockQuantity || !canRedeem}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Thông báo lỗi */}
                                    {!isAvailable && (
                                        <p className="text-sm text-center text-destructive-foreground bg-destructive p-2 rounded-md">
                                            This item is currently unavailable.
                                        </p>
                                    )}
                                    {/* Dùng `!currentMembership` */}
                                    {isAvailable && !currentMembership && !profileLoading && (
                                        <p className="text-sm text-center text-yellow-800 bg-yellow-100 p-2 rounded-md">
                                            You must be a member of this club to redeem this item.
                                        </p>
                                    )}

                                    {/* Logic disable nút */}
                                    <Button
                                        size="lg"
                                        className="w-full text-lg"
                                        onClick={() => setIsConfirmOpen(true)}
                                        disabled={!canRedeem || isRedeeming || profileLoading} // Thêm profileLoading
                                    >
                                        {profileLoading ? (
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        ) : isRedeeming ? (
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        ) : (
                                            <ShoppingCart className="h-5 w-5 mr-2" />
                                        )}
                                        {/* Text nút */}
                                        {profileLoading ? "Loading membership..." : (isRedeeming ? "Processing..." : "Redeem Now")}
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground">
                                        Total: {product.pointCost * quantity} points
                                    </p>


                                </CardContent>
                            </Card>

                            <Separator />

                            {/* Chi tiết sản phẩm */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Info className="h-5 w-5" />
                                        Description
                                    </h3>
                                    <p className="text-muted-foreground mt-2 whitespace-pre-line">
                                        {product.description || "No description provided."}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Tag className="h-5 w-5" />
                                        Tags
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {product.tags.length > 0 ? (
                                            product.tags.map((tag) => (
                                                <Badge key={tag} variant="secondary">
                                                    {tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No tags.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dialog Xác nhận */}
                <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Redemption</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to redeem <strong>{quantity} x {product.name}</strong>
                                {" "}for a total of <strong>{product.pointCost * quantity}</strong> points?
                                This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)} disabled={isRedeeming}>
                                Cancel
                            </Button>
                            <Button onClick={handleRedeem} disabled={isRedeeming}>
                                {isRedeeming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Confirm
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AppShell>
        </ProtectedRoute>
    )
}