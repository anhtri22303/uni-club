"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  getProductById,
  Product,
  checkEventProductValid,
  EventProductValidation,
} from "@/service/productApi";
import { getEventById, Event } from "@/service/eventApi";
import {
  redeemClubProduct,
  redeemEventProduct,
  RedeemPayload,
} from "@/service/redeemApi";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/contexts/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Package,
  DollarSign,
  Tag,
  Info,
  ShoppingCart,
  AlertCircle,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  WalletCards,
  Play,
  QrCode,
} from "lucide-react";
import { EventItemOrderQRModal } from "@/components/event-item-order-qr-modal";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile, queryKeys, useFullProfile } from "@/hooks/use-query-hooks";

export default function StudentProductViewPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [eventValidation, setEventValidation] =
    useState<EventProductValidation | null>(null);
  const [isEventExpired, setIsEventExpired] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [eventData, setEventData] = useState<Event | null>(null);

  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();
  const productId = params.id as string;
  const { data: profile, isLoading: profileLoading } = useProfile(true);
  const { data: fullProfile, isLoading: fullProfileLoading } =
    useFullProfile(true);
  const searchParams = useSearchParams();
  const clubIdFromQuery = searchParams.get("clubId");

  const fetchProduct = useCallback(async () => {
    // Chờ cả productId VÀ clubIdFromQuery
    if (!productId || !clubIdFromQuery) {
      console.warn("Đang chờ productId hoặc clubIdFromQuery...");
      return;
    }

    setLoading(true);
    try {
      //  Chuyển đổi clubIdFromQuery (string) thành số (number)
      const numericClubId = Number(clubIdFromQuery);

      // Kiểm tra xem việc chuyển đổi có thành công không
      if (isNaN(numericClubId)) {
        throw new Error("Invalid Club ID in URL.");
      }
      // Sử dụng clubIdFromQuery (từ URL) để fetch
      const productData = await getProductById(numericClubId, productId);
      setProduct(productData);

      // Kiểm tra nếu là EVENT_ITEM thì gọi API kiểm tra event còn hạn không
      if (productData.type === "EVENT_ITEM") {
        try {
          const validation = await checkEventProductValid(
            numericClubId,
            productId
          );
          setEventValidation(validation);
          // Kiểm tra nếu event đã COMPLETED và expired
          setIsEventExpired(
            validation.eventStatus === "COMPLETED" && validation.expired
          );

          // Fetch event details for QR code
          if (productData.eventId) {
            try {
              const event = await getEventById(productData.eventId);
              setEventData(event);
            } catch (eventError) {
              console.error("Failed to fetch event details:", eventError);
            }
          }
        } catch (error) {
          console.error("Failed to validate event product:", error);
          // Nếu API lỗi, giả định sản phẩm vẫn hợp lệ
          setIsEventExpired(false);
        }
      } else {
        setIsEventExpired(false);
      }

      const thumbnail = productData.media.find((m) => m.thumbnail);
      setSelectedImage(thumbnail ? thumbnail.url : productData.media[0]?.url);
    } catch (error) {
      console.error("Failed to load product details:", error);
      toast({
        title: "Error",
        description: "Unable to load product details.",
        variant: "destructive",
      });
      router.back(); // Quay lại (an toàn)
    } finally {
      setLoading(false);
    }
    //  clubIdFromQuery vào dependencies
  }, [productId, clubIdFromQuery, router, toast]);

  //  useEffect để lắng nghe clubIdFromQuery
  useEffect(() => {
    // Chỉ chạy khi clubIdFromQuery đã sẵn sàng
    if (clubIdFromQuery) {
      fetchProduct();
    }
  }, [fetchProduct, clubIdFromQuery]);

  // useMemo
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
    const foundMembership = profile.find(
      (membership: any) => membership.clubId === product.clubId
    );

    if (!foundMembership) {
      return null; // Trả về null -> sẽ hiển thị thông báo "You must be a member..."
    }

    // (Logic kiểm tra membershipId đã đúng)
    if (!foundMembership.membershipId) {
      console.error(
        `%c[LỖI API] Dữ liệu 'profile' BỊ THIẾU 'membershipId' cho club ${product.clubId}!`,
        "color: orange; font-weight: bold;"
      );
    } else {
      console.log(
        `%c[THÀNH CÔNG] Đã tìm thấy membership:`,
        "color: green;",
        foundMembership
      );
    }

    return foundMembership;
  }, [product, profile]);

  // **LẤY SỐ DƯ ĐIỂM CỦA NGƯỜI DÙNG**
  const userBalancePoints = useMemo(() => {
    // fullProfile chứa object wallet (dựa trên useFullProfile hook)
    return fullProfile?.wallet?.balancePoints ?? 0;
  }, [fullProfile]);

  // **TÍNH TOÁN TỔNG CHI PHÍ**
  const totalCost = product ? product.pointCost * quantity : 0;
  // **KIỂM TRA ĐỦ ĐIỂM**
  const hasEnoughPoints = userBalancePoints >= totalCost;

  // Sắp xếp lại mảng media
  const sortedMedia = useMemo(() => {
    if (!product || !product.media) return [];

    // Tạo một bản sao để sắp xếp
    const mediaArray = [...product.media];

    // Sắp xếp: ảnh thumbnail = true sẽ lên đầu
    return mediaArray.sort((a, b) => {
      if (a.thumbnail && !b.thumbnail) return -1; // a lên trước
      if (!a.thumbnail && b.thumbnail) return 1; // b lên trước
      return 0; // Giữ nguyên thứ tự
    });
  }, [product]);

  // Hàm xử lý chuyển ảnh
  const handleImageNavigation = (direction: "next" | "prev") => {
    if (!selectedImage || sortedMedia.length <= 1) return;

    // Tìm vị trí (index) của ảnh đang được chọn
    const currentIndex = sortedMedia.findIndex((m) => m.url === selectedImage);
    if (currentIndex === -1) return; // Không tìm thấy (sẽ không xảy ra)

    let nextIndex;
    if (direction === "next") {
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
        });
        return product.stockQuantity; // Tối đa là tồn kho
      }
      return newQuantity;
    });
  };

  const handleRedeem = async () => {
    // **THÊM KIỂM TRA ĐIỂM**
    if (!product || !currentMembership) {
      toast({
        title: "Error",
        description: "Cannot redeem. Product or membership data is missing.",
        variant: "destructive",
      });
      return;
    }
    if (!hasEnoughPoints) {
      toast({
        title: "Redemption Failed",
        description: `You don't have enough points! Required: ${totalCost.toLocaleString(
          "en-US"
        )} pts, Your balance: ${userBalancePoints.toLocaleString(
          "en-US"
        )} pts.`,
        variant: "destructive",
      });
      return; // DỪNG Ở ĐÂY NẾU KHÔNG ĐỦ ĐIỂM
    }

    if (!currentMembership.membershipId) {
      toast({
        title: "Error",
        description: "Membership ID not found. Cannot redeem.",
        variant: "destructive",
      });
      return;
    }

    setIsConfirmOpen(true);
    setIsRedeeming(true);
    const payload: RedeemPayload = {
      productId: product.id,
      quantity: quantity,
      membershipId: currentMembership.membershipId, // Lấy ID từ membership
    };

    try {
      let redeemedOrder;
      if (product.type === "EVENT_ITEM" && product.eventId) {
        redeemedOrder = await redeemEventProduct(product.eventId, payload);
      } else if (product.type === "CLUB_ITEM") {
        redeemedOrder = await redeemClubProduct(product.clubId, payload);
      } else {
        throw new Error(
          "Invalid product data. Cannot determine redeem endpoint."
        );
      }

      toast({
        title: "Success",
        description: `You have successfully redeemed ${redeemedOrder.quantity} x ${redeemedOrder.productName}.`,
        variant: "success",
      });
      setIsConfirmOpen(false);
      setQuantity(1);

      // 1. Làm mới danh sách membership (đã có)
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });

      // 2. Làm mới profile ĐẦY ĐỦ (cho UserProfileWidget)
      queryClient.invalidateQueries({ queryKey: queryKeys.fullProfile });

      // 3. Làm mới lịch sử đổi quà (cho trang History)
      queryClient.invalidateQueries({ queryKey: queryKeys.myRedeemOrders() });

      // 4. Tải lại thông tin sản phẩm (đã có - để cập nhật stock)
      await fetchProduct();
    } catch (error: any) {
      toast({
        title: "Redemption Failed",
        description:
          error.message || "Not enough points or product is out of stock.",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleConfirmRedeem = async () => {
    // Cần product và currentMembership (thay vì currentWallet)
    if (!product || !currentMembership || !hasEnoughPoints) {
      // Double check trước khi gọi API
      toast({
        title: "Error",
        description: "Pre-check failed. Please refresh the page.",
        variant: "destructive",
      });
      setIsConfirmOpen(false);
      return;
    }

    setIsRedeeming(true);
    const payload: RedeemPayload = {
      productId: product.id,
      quantity: quantity,
      membershipId: currentMembership.membershipId, // Lấy ID từ membership
    };

    try {
      let redeemedOrder;
      if (product.type === "EVENT_ITEM" && product.eventId) {
        redeemedOrder = await redeemEventProduct(product.eventId, payload);
      } else if (product.type === "CLUB_ITEM") {
        redeemedOrder = await redeemClubProduct(product.clubId, payload);
      } else {
        throw new Error(
          "Invalid product data. Cannot determine redeem endpoint."
        );
      }

      toast({
        title: "Success",
        description: `You have successfully redeemed ${redeemedOrder.quantity} x ${redeemedOrder.productName}.`,
        variant: "success",
      });
      setIsConfirmOpen(false);
      setQuantity(1);

      // 1. Làm mới danh sách membership (đã có)
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });

      // 2. Làm mới profile ĐẦY ĐỦ (cho UserProfileWidget)
      queryClient.invalidateQueries({ queryKey: queryKeys.fullProfile });

      // 3. Làm mới lịch sử đổi quà (cho trang History)
      queryClient.invalidateQueries({ queryKey: queryKeys.myRedeemOrders() });

      // 4. Tải lại thông tin sản phẩm (đã có - để cập nhật stock)
      await fetchProduct();
    } catch (error: any) {
      // Đóng modal và hiển thị lỗi
      setIsConfirmOpen(false);
      setIsRedeeming(false);
      
      toast({
        title: "Redemption Failed",
        description:
          error.message || "Not enough points or product is out of stock.",
        variant: "destructive",
      });
      
      // Reload trang sau khi hiển thị toast
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
      return; // Dừng thực thi
    } finally {
      setIsRedeeming(false);
    }
  };

  //  Thêm `profileLoading` vào logic skeleton
  // if ((loading && !product) || profileLoading) {
  //     return (
  //         <ProtectedRoute allowedRoles={["student"]}>
  //             <AppShell>
  //                 <LoadingSkeleton className="h-[600px]" />
  //             </AppShell>
  //         </ProtectedRoute>
  //     )
  // }
  // **CẬP NHẬT: THÊM fullProfileLoading**
  if ((loading && !product) || profileLoading || fullProfileLoading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <AppShell>
          <LoadingSkeleton className="h-[600px]" />
        </AppShell>
      </ProtectedRoute>
    );
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
              <p className="text-muted-foreground">
                This product may have been removed or is unavailable.
              </p>
            </CardContent>
          </Card>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const isAvailable =
    product.status === "ACTIVE" && product.stockQuantity > 0 && !isEventExpired;
  // const canRedeem = isAvailable && currentMembership != null && !profileLoading;
  // **CẬP NHẬT: THÊM hasEnoughPoints và fullProfileLoading**
  const canRedeem =
    isAvailable &&
    currentMembership != null &&
    !profileLoading &&
    !fullProfileLoading;

  // Tạo hàm quay lại (Back)
  const handleBack = () => {
    if (clubIdFromQuery) {
      // Nếu có clubId, quay về trang gift VỚI clubId đó
      router.push(`/student/gift?clubId=${clubIdFromQuery}`);
    } else {
      // Nếu không (ví dụ: vào từ bookmark), quay về trang gift cơ bản
      router.push("/student/gift");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell>
        <div className="space-y-6">
          {/* Back Button with gradient hover */}
          <div>
            <Button
              variant="ghost"
              onClick={handleBack}
              className="group rounded-md border border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Gift Shop
            </Button>
          </div>

          {/* Layout chính: 2 cột với shadow và rounded */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CỘT TRÁI: HÌNH ẢNH - Enhanced with modern styling */}
            <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              {/* Main Image Card */}
              <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center relative group">
                    {selectedImage ? (
                      <>
                        {/* Check if selected media is a video */}
                        {sortedMedia.find((m) => m.url === selectedImage)
                          ?.type === "VIDEO" ? (
                          <video
                            src={selectedImage}
                            controls
                            className="object-cover w-full h-full"
                            autoPlay
                            loop
                            muted
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <>
                            <img
                              src={selectedImage}
                              alt={product.name}
                              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl">
                          <Package className="h-24 w-24 text-primary" />
                        </div>
                        <p className="text-muted-foreground font-medium dark:text-slate-300">
                          No image available
                        </p>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    {sortedMedia.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border-2 dark:border-slate-700 hover:scale-110 shadow-lg"
                          onClick={() => handleImageNavigation("prev")}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border-2 dark:border-slate-700 hover:scale-110 shadow-lg"
                          onClick={() => handleImageNavigation("next")}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </>
                    )}

                    {/* Image Counter Badge */}
                    {sortedMedia.length > 1 && (
                      <Badge
                        variant="secondary"
                        className="absolute bottom-4 right-4 bg-black/60 text-white border-0 backdrop-blur-sm"
                      >
                        {sortedMedia.findIndex((m) => m.url === selectedImage) +
                          1}{" "}
                        / {sortedMedia.length}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Thumbnail Grid */}
              {sortedMedia.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {sortedMedia.map((m) => (
                    <button
                      key={m.mediaId}
                      className={`aspect-square rounded-xl overflow-hidden border-3 transition-all duration-300 hover:scale-105 hover:shadow-lg relative ${
                        selectedImage === m.url
                          ? "border-primary ring-2 ring-primary ring-offset-2 shadow-lg"
                          : "border-gray-200 dark:border-slate-700 hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedImage(m.url)}
                    >
                      {m.type === "VIDEO" ? (
                        <>
                          <video
                            src={m.url}
                            className="object-cover w-full h-full"
                            muted
                          />
                          {/* Play icon overlay for videos */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="bg-white/90 dark:bg-slate-900/90 rounded-full p-2">
                              <Play className="h-4 w-4 text-primary fill-primary" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <img
                          src={m.url}
                          alt="Product thumbnail"
                          className="object-cover w-full h-full"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CỘT PHẢI: THÔNG TIN & HÀNH ĐỘNG - Enhanced */}
            <div className="space-y-6">
              {/* Product Name with gradient */}
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {product.name}
                </h1>
                <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
              </div>

              {/* Price and Stock - Enhanced Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider dark:text-slate-300">
                        Redemption Cost
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                          <WalletCards className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                          {product.pointCost.toLocaleString("en-US")}
                        </span>
                        <span className="text-2xl font-semibold text-muted-foreground">
                          pts
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider dark:text-slate-300">
                        Availability
                      </p>
                      <Badge
                        variant={
                          isEventExpired
                            ? "destructive"
                            : isAvailable
                            ? "default"
                            : "destructive"
                        }
                        className={`text-base px-5 py-2 shadow-md ${
                          isEventExpired
                            ? "bg-orange-500 hover:bg-orange-600"
                            : isAvailable
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            : ""
                        }`}
                      >
                        <Package className="h-5 w-5 mr-2" />
                        {isEventExpired
                          ? "Event Ended"
                          : isAvailable
                          ? `${product.stockQuantity.toLocaleString(
                              "en-US"
                            )} in stock`
                          : "Out of Stock"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Redemption Section - Enhanced */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-gray-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
                <CardContent className="p-6 space-y-6">
                  {/* Quantity Selector */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="quantity"
                      className="text-base font-semibold"
                    >
                      Select Quantity
                    </Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1 || !canRedeem}
                        className="h-12 w-12 rounded-xl border-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:scale-110 disabled:hover:scale-100 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        readOnly
                        className="w-24 h-12 text-center text-2xl font-bold border-2 rounded-xl dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(1)}
                        disabled={
                          quantity >= product.stockQuantity || !canRedeem
                        }
                        className="h-12 w-12 rounded-xl border-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:scale-110 disabled:hover:scale-100 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Total Cost Display */}
                  <div className="p-4 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-xl border-2 border-primary/20 dark:bg-none dark:bg-slate-800 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-700 dark:text-slate-200">
                        Total Cost:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                          {(product.pointCost * quantity).toLocaleString(
                            "en-US"
                          )}
                        </span>
                        <span className="text-xl font-semibold text-gray-600 dark:text-slate-300">
                          points
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warning Messages */}
                  {!isAvailable && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-semibold text-red-900">
                          This item is currently unavailable.
                        </p>
                      </div>
                    </div>
                  )}
                  {isAvailable && !currentMembership && !profileLoading && (
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-semibold text-yellow-900 dark:text-yellow-200">
                          You must be a member of this club to redeem this item.
                        </p>
                      </div>
                    </div>
                  )}
                  {/* **CẢNH BÁO MỚI: KHÔNG ĐỦ ĐIỂM (Không vô hiệu hóa nút)** */}
                  {isAvailable &&
                    currentMembership &&
                    !hasEnoughPoints &&
                    !fullProfileLoading && (
                      <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl dark:from-red-950/30 dark:to-orange-950/30 dark:border-red-900">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-white" />
                          </div>
                          <p className="font-semibold text-red-900 dark:text-red-300">
                            Warning: Your balance (
                            {userBalancePoints.toLocaleString("en-US")} pts) is
                            less than the total cost (
                            {totalCost.toLocaleString("en-US")} pts).
                            <br />
                            You can not redeem with this quantity.
                          </p>
                        </div>
                      </div>
                    )}
                  {/* Conditional Button: EVENT_ITEM vs CLUB_ITEM */}
                  {product.type === "EVENT_ITEM" ? (
                    // EVENT_ITEM: Show "Your Order QR" button
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg font-bold 
               text-white hover:text-white disabled:text-white
               bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
               hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 
               shadow-xl hover:shadow-2xl transition-all duration-300 
               hover:scale-[1.02] disabled:hover:scale-100"
                      onClick={() => setIsQRModalOpen(true)}
                      disabled={!canRedeem}
                    >
                      {profileLoading || fullProfileLoading ? (
                        <>
                          <Loader2 className="h-6 w-6 mr-3 animate-spin text-white" />
                          Loading data...
                        </>
                      ) : isEventExpired ? (
                        <>
                          <AlertCircle className="h-6 w-6 mr-3 text-white" />
                          Event Has Ended
                        </>
                      ) : (
                        <>
                          <QrCode className="h-6 w-6 mr-3 text-white" />
                          Your Order QR
                        </>
                      )}
                    </Button>
                  ) : (
                    // CLUB_ITEM: Show "Redeem Now" button
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg font-bold 
               text-white hover:text-white disabled:text-white
               bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 
               hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 
               shadow-xl hover:shadow-2xl transition-all duration-300 
               hover:scale-[1.02] disabled:hover:scale-100"
                      onClick={handleRedeem}
                      disabled={!canRedeem || isRedeeming}
                    >
                      {profileLoading || fullProfileLoading ? (
                        <>
                          <Loader2 className="h-6 w-6 mr-3 animate-spin text-white" />
                          Loading data...
                        </>
                      ) : isRedeeming ? (
                        <>
                          <Loader2 className="h-6 w-6 mr-3 animate-spin text-white" />
                          Processing...
                        </>
                      ) : isEventExpired ? (
                        <>
                          <AlertCircle className="h-6 w-6 mr-3 text-white" />
                          Event Has Ended
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-6 w-6 mr-3 text-white" />
                          Redeem Now
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Description Section - Enhanced */}
              <Card className="border-0 shadow-lg dark:bg-slate-900">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                      <Info className="h-5 w-5 text-white" />
                    </div>
                    <span className="dark:text-slate-100">
                      Product Description
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line dark:text-slate-300">
                    {product.description ||
                      "No description provided for this amazing product. Contact the club for more details!"}
                  </p>
                </CardContent>
              </Card>

              {/* Tags Section - Enhanced */}
              <Card className="border-0 shadow-lg dark:bg-slate-900">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg">
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                    <span className="dark:text-slate-100">Product Tags</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {product.tags.length > 0 ? (
                      product.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-base px-4 py-2 border-2 border-primary/30 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 hover:scale-105 font-semibold dark:from-blue-950/30 dark:to-purple-950/30 dark:text-blue-200"
                        >
                          <Tag className="h-3 w-3 mr-2" />
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic dark:text-slate-400">
                        No tags available for this product.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Enhanced Confirmation Dialog */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                Confirm Redemption
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-base space-y-4 pt-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Product</p>
                        <p className="font-bold text-gray-900">
                          {product.name}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Quantity
                        </p>
                        <p className="font-bold text-gray-900 text-lg">
                          {quantity.toLocaleString("en-US")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Cost
                        </p>
                        <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg">
                          {(product.pointCost * quantity).toLocaleString(
                            "en-US"
                          )}{" "}
                          pts
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* **HIỂN THỊ ĐIỂM TRONG DIALOG (Sửa màu cảnh báo)** */}
                  <div className="flex items-center justify-between p-3 bg-gray-100/70 rounded-lg border dark:bg-slate-700/50 dark:border-slate-700">
                    <p className="text-sm font-medium text-muted-foreground">
                      Your Balance:
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        hasEnoughPoints ? "text-primary" : "text-red-500"
                      }`}
                    >
                      {userBalancePoints.toLocaleString("en-US")} pts
                    </p>
                  </div>
                  {/* **DÒNG MỚI: CẢNH BÁO THIẾU ĐIỂM TRONG DIALOG** */}
                  {!hasEnoughPoints && (
                    <div className="p-3 bg-red-100 border-2 border-red-300 rounded-lg dark:bg-red-950/30 dark:border-red-900">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm font-semibold text-red-900 dark:text-red-300">
                          You are **short of{" "}
                          {(totalCost - userBalancePoints).toLocaleString(
                            "en-US"
                          )}{" "}
                          points**. Attempting to confirm will result in an
                          error.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-semibold text-yellow-900">
                        This action cannot be undone! Points will be deducted
                        from your wallet immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isRedeeming}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                // onClick={handleRedeem}
                onClick={handleConfirmRedeem}
                disabled={isRedeeming}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Confirm Redemption
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Event Item Order QR Modal */}
        {product.type === "EVENT_ITEM" && currentMembership && product.eventId && (
          <EventItemOrderQRModal
            open={isQRModalOpen}
            onOpenChange={setIsQRModalOpen}
            productId={product.id}
            quantity={quantity}
            membershipId={currentMembership.membershipId}
            eventId={product.eventId}
            productName={product.name}
            eventName={eventData?.name}
            memberName={fullProfile?.fullName}
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
