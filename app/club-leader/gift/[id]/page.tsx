"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  getProductById, Product, AddProductPayload, updateProduct, UpdateProductPayload, addMediaToProduct, deleteMediaFromProduct,
  setMediaThumbnail, getStockHistory, StockHistory, updateStock, checkEventProductValid, EventProductValidation,
} from "@/service/productApi";
import { getTags, Tag as ProductTag } from "@/service/tagApi";
import { getEventByClubId, Event } from "@/service/eventApi";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/contexts/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Save, Loader2, Package, DollarSign, Archive, Tag, Image as ImageIcon, CheckCircle, Upload, Trash, Star,
  History, Plus, XCircle, Video as VideoIcon, Play, Eye, HandCoins, Search, AlertCircle, WalletCards,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { getClubIdFromToken } from "@/service/clubApi";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys, useClubWallet } from "@/hooks/use-query-hooks";

type ProductEditForm = UpdateProductPayload;
interface FixedTagIds {
  clubTagId: number | null;
  eventTagId: number | null;
}

// --- NEW: Định nghĩa danh sách lý do xuất kho (Khớp với Enum Java) ---
const STOCK_REMOVAL_REASONS = [
  { value: "LOSS_DAMAGE", label: "Loss / Damage (Mất / Hư hỏng)" },
  { value: "RETURN_SUPPLIER", label: "Return to Supplier (Trả nhà cung cấp)" },
  { value: "INTERNAL_USE", label: "Internal Use (Sử dụng nội bộ)" },
  { value: "CORRECTION", label: "Correction (Điều chỉnh kiểm kê)" },
];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [product, setProduct] = useState<Product | null>(null); // Dữ liệu gốc
  const [form, setForm] = useState<ProductEditForm | null>(null);
  const [allTags, setAllTags] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clubId, setClubId] = useState<number | null>(null);
  const productId = params.id as string;
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false); // State cho việc xóa
  const [eventValidation, setEventValidation] =
    useState<EventProductValidation | null>(null);
  const [isEventExpired, setIsEventExpired] = useState(false);
  // STATE MEDIA DIALOG
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
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
  // --- NEW: State cho lý do nhập/xuất kho ---
  const [stockReason, setStockReason] = useState<string>("");
  // STATE ĐỂ HIỂN THỊ GIÁ
  const [displayPrice, setDisplayPrice] = useState<string>("");
  //Biến kiểm tra xem có bị Archived không
  const isArchived = product?.status === "ARCHIVED";
  // STATE CHO MEDIA VIEWER
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: string;
  } | null>(null);
  // STATE CHO IMAGE CROP
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");
  // STATE CHO EVENTS LIST
  const [events, setEvents] = useState<Event[]>([]);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("");
  // --- Lấy thông tin ví ---
  const { data: clubWallet } = useClubWallet(clubId);
  // --- Hàm Helper (Hàm hỗ trợ) ---
  const formatNumber = (num: number | string): string => {
    return Number(num).toLocaleString("en-US");
  };
  const parseFormattedNumber = (str: string): number => {
    return Number(str.replace(/,/g, ""));
  };
  // Hàm truncate tên file nếu quá dài
  const truncateFileName = (
    fileName: string,
    maxLength: number = 40
  ): string => {
    if (fileName.length <= maxLength) return fileName;

    const lastDotIndex = fileName.lastIndexOf(".");
    // Nếu không có extension hoặc extension quá dài
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      // File không có extension, truncate từ đầu
      return fileName.substring(0, maxLength - 3) + "...";
    }

    const extension = fileName.substring(lastDotIndex);
    const nameWithoutExt = fileName.substring(0, lastDotIndex);

    // Đảm bảo extension không quá dài
    if (extension.length > maxLength / 2) {
      return fileName.substring(0, maxLength - 3) + "...";
    }

    // Truncate phần tên, giữ lại extension
    const availableLength = maxLength - extension.length - 3; // 3 cho "..."
    if (availableLength <= 0) {
      return "..." + extension;
    }

    const truncatedName = nameWithoutExt.substring(0, availableLength);
    return `${truncatedName}...${extension}`;
  };

  // Crop image utility function with high quality preservation
  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Use natural dimensions for high quality output
      const naturalCropWidth = crop.width * scaleX;
      const naturalCropHeight = crop.height * scaleY;

      canvas.width = naturalCropWidth;
      canvas.height = naturalCropHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return Promise.reject(new Error("No 2d context"));
      }

      // Enable high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

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
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas is empty"));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          0.95
        );
      });
    },
    []
  );

  const handleCropComplete = useCallback(async () => {
    if (!imgRef.current || !completedCrop) {
      toast({
        title: "Error",
        description: "Please select a crop area first",
        variant: "destructive",
      });
      return;
    }

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      setCroppedImageBlob(croppedBlob);

      // Convert blob to file
      const croppedFile = new File(
        [croppedBlob],
        originalFileName || "cropped-image.jpg",
        {
          type: "image/jpeg",
        }
      );

      setNewMediaFile(croppedFile);
      setIsCropDialogOpen(false);

      toast({
        title: "Success",
        description: "Image cropped successfully! Click 'Upload' to add it.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error cropping image:", error);
      toast({
        title: "Error",
        description: "Failed to crop image",
        variant: "destructive",
      });
    }
  }, [completedCrop, getCroppedImg, originalFileName, toast]);

  const handleCropCancel = () => {
    setIsCropDialogOpen(false);
    setImageSrc("");
    setCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    });
    setCompletedCrop(undefined);
    setCroppedImageBlob(null);
  };

  // 1. Lấy clubId
  useEffect(() => {
    const id = getClubIdFromToken();
    if (id) {
      setClubId(id);
      // Fetch events list
      getEventByClubId(id)
        .then(setEvents)
        .catch((err) => {
          console.error("Failed to fetch events:", err);
        });
    } else {
      toast({
        title: "Error",
        description: "Club ID not found.",
        variant: "destructive",
      });
      router.back();
    }
  }, [router, toast]);

  // }, [router, toast]) // Thêm dependencies
  const fetchProductData = useCallback(
    async (cId: number, pId: string) => {
      try {
        const [productData, tagsData] = await Promise.all([
          getProductById(cId, pId),
          getTags(),
        ]);

        setProduct(productData);
        setAllTags(tagsData);

        // Kiểm tra nếu là EVENT_ITEM thì gọi API kiểm tra event còn hạn không
        if (productData.type === "EVENT_ITEM") {
          try {
            const validation = await checkEventProductValid(cId, pId);
            setEventValidation(validation);
            // Kiểm tra nếu event đã COMPLETED và expired
            setIsEventExpired(
              validation.eventStatus === "COMPLETED" && validation.expired
            );
          } catch (error) {
            console.error("Failed to validate event product:", error);
            // Nếu API lỗi, giả định sản phẩm vẫn hợp lệ
            setIsEventExpired(false);
          }
        } else {
          setIsEventExpired(false);
        }

        // Tìm và lưu các tag cố định
        const clubTag = tagsData.find(
          (tag) => tag.name.toLowerCase() === "club"
        );
        const eventTag = tagsData.find(
          (tag) => tag.name.toLowerCase() === "event"
        );
        setFixedTagIds({
          clubTagId: clubTag ? clubTag.tagId : null,
          eventTagId: eventTag ? eventTag.tagId : null,
        });

        // --- QUAN TRỌNG: Chuyển đổi dữ liệu cho form ---
        const loadedTagIds = tagsData
          .filter((tag) => productData.tags.includes(tag.name))
          .map((tag) => tag.tagId);

        setForm({
          name: productData.name,
          description: productData.description,
          pointCost: productData.pointCost,
          stockQuantity: productData.stockQuantity,
          type: productData.type || "CLUB_ITEM",
          eventId: productData.eventId,
          tagIds: loadedTagIds,
          status: productData.status,
        });

        setDisplayPrice(formatNumber(productData.pointCost));
      } catch (error) {
        console.error("Failed to load product details:", error);
        toast({
          title: "Error",
          description: "Unable to load product details.",
          variant: "destructive",
        });
        router.back();
      }
    },
    [router, toast]
  ); // Thêm dependencies

  // 2. Fetch dữ liệu lần đầu
  useEffect(() => {
    if (clubId && productId) {
      setLoading(true);
      fetchProductData(clubId, productId).finally(() => {
        setLoading(false);
      });
    }
  }, [clubId, productId, fetchProductData]); // Thêm fetchProductData

  // HANDLERS CHO FORM
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (!form) return;

    // XỬ LÝ ĐẶC BIỆT CHO "pointCost"
    if (name === "pointCost") {
      // Chỉ cho phép số và dấu phẩy
      const numericValue = value.replace(/[^0-9]/g, "");
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
        [name]: name === "eventId" ? (value === "" ? 0 : Number(value)) : value,
      });
    }
  };
  const handleSelectChange = (name: string) => (value: string) => {
    if (!form) return;

    // Chỉ xử lý logic đặc biệt khi đổi 'type' (Product Type)
    if (name === "type") {
      const { clubTagId, eventTagId } = fixedTagIds;

      setForm((prev) => {
        if (!prev) return null; // Thêm kiểm tra null

        let newTagIds = [...prev.tagIds];

        // Lọc bỏ cả 2 tag cố định
        newTagIds = newTagIds.filter(
          (id) => id !== clubTagId && id !== eventTagId
        );

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
  };

  // handleTagChange (Không cho phép bỏ chọn tag cố định)
  const handleTagChange = (tagId: number) => (checked: boolean) => {
    if (!form) return;
    const { clubTagId, eventTagId } = fixedTagIds;

    // Nếu tag là tag cố định, không cho làm gì cả
    if (tagId === clubTagId || tagId === eventTagId) {
      return;
    }

    // Logic cũ cho các tag khác
    const currentTags = form.tagIds || [];
    let newTagIds: number[];
    if (checked) {
      newTagIds = [...currentTags, tagId];
    } else {
      newTagIds = currentTags.filter((id) => id !== tagId);
    }
    setForm({ ...form, tagIds: newTagIds });
  };

  const handleSave = async () => {
    if (!form || !clubId || !productId || !product) return; // Thêm !product

    if (product.status === "ARCHIVED") {
      toast({
        title: "Error",
        description: "Cannot edit products that are in ARCHIVED status",
        variant: "destructive",
      });
      return; // Dừng hàm
    }

    if (!form.tagIds || form.tagIds.length === 0) {
      toast({
        title: "Error",
        description: "Product must have at least one tag.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateProduct(clubId, productId, form);

      toast({
        title: "Success",
        description: "Product updated successfully.",
        variant: "success",
      });

      // Báo cho React Query rằng "danh sách sản phẩm của club này" đã cũ.
      // Bất kỳ trang nào đang dùng hook `useProductsByClubId(clubId)` sẽ tự động tải lại.
      queryClient.invalidateQueries({
        queryKey: queryKeys.productsByClubId(clubId),
      });

      // Bước 3: Tải lại dữ liệu
      await fetchProductData(clubId, productId);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          (error as any).response?.data?.message ||
          error.message ||
          "Failed to update product.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // HÀM TẢI LẠI SẢN PHẨM (Dùng cho Media)
  const refetchProduct = async () => {
    if (!clubId || !productId) return;
    try {
      setIsMediaLoading(true); // Chỉ dùng loading của Media
      await fetchProductData(clubId, productId);

      queryClient.invalidateQueries({
        queryKey: queryKeys.productsByClubId(clubId),
      });

      toast({
        title: "Success",
        description: "Media updated.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reload product.",
        variant: "destructive",
      });
    } finally {
      setIsMediaLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOriginalFileName(file.name);

      // Check if it's an image
      if (file.type.startsWith("image/")) {
        // Open crop modal for images
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          setImageSrc(reader.result?.toString() || "");
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
        variant: "destructive",
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
        variant: "destructive",
      });
    } finally {
      setIsMediaLoading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    if (!clubId || !productId) return;
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    setIsMediaLoading(true);
    try {
      await deleteMediaFromProduct(clubId, productId, mediaId);
      await refetchProduct(); // Tải lại
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete media.",
        variant: "destructive",
      });
    } finally {
      setIsMediaLoading(false);
    }
  };

  const handleSetThumbnail = async (newMediaId: number) => {
    if (!clubId || !productId || !product) return;

    // Kiểm tra xem đã là thumbnail chưa
    const currentMedia = product.media.find((m) => m.mediaId === newMediaId);
    if (currentMedia && currentMedia.thumbnail) {
      toast({ title: "Info", description: "This is already the thumbnail." });
      return; // Không làm gì cả
    }

    // Kiểm tra xem có phải là video không - video không thể được set làm thumbnail
    if (currentMedia && currentMedia.type === "VIDEO") {
      toast({
        title: "Error",
        description: "Videos cannot be set as thumbnail.",
        variant: "destructive",
      });
      return;
    }

    setIsMediaLoading(true);

    try {
      // Chỉ cần gọi API mới
      // Backend sẽ tự động gỡ thumbnail cũ (theo Swagger)
      await setMediaThumbnail(clubId, productId, newMediaId);

      await refetchProduct(); // Tải lại để cập nhật UI
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set thumbnail.",
        variant: "destructive",
      });
    } finally {
      setIsMediaLoading(false);
    }
  };

  // --- Handler Update Stock ---
  // const handleUpdateStock = async () => {
  //   if (!clubId || !productId) return;

  //   const delta = parseFormattedNumber(stockChange);

  //   // Validate cơ bản
  //   if (isNaN(delta) || delta === 0) {
  //     toast({
  //       title: "Error",
  //       description: "Please enter a valid number (e.g. 50 or -10).",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   const isRemoving = delta < 0;

  //   // VALIDATION LOGIC
  //   if (isRemoving) {
  //     if (!stockReason) {
  //       toast({
  //         title: "Error",
  //         description: "Please select a reason for removing stock.",
  //         variant: "destructive",
  //       });
  //       return;
  //     }
  //   } else {
  //     if (!stockNote.trim()) {
  //       toast({
  //         title: "Error",
  //         description: "Please provide a note for this stock addition.",
  //         variant: "destructive",
  //       });
  //       return;
  //     }
  //   }

  //   setIsStockLoading(true);
  //   try {
  //     // 1. Xác định Reason:
  //     // - Nếu xuất kho (isRemoving = true): Lấy từ biến stockReason (dropdown).
  //     // - Nếu nhập kho (isRemoving = false): Gán là null (hoặc undefined) để không gửi reason lên BE.
  //     const finalReason = isRemoving ? stockReason : undefined;

  //     // 2. Xử lý Note:
  //     let finalNote = stockNote.trim();

  //     if (isRemoving) {
  //       // Chỉ khi xuất kho mới cần gộp Label của Reason vào Note cho dễ đọc
  //       const reasonLabel = STOCK_REMOVAL_REASONS.find(r => r.value === stockReason)?.label || stockReason;
  //       finalNote = finalNote
  //         ? `[${reasonLabel}] - ${finalNote}`
  //         : `[${reasonLabel}]`;
  //     }

  //     // 3. Gọi API
  //     // (Lưu ý: Nếu file api definition của bạn bắt buộc reason là string, bạn có thể cần sửa file api thành string | null)
  //     await updateStock(clubId, productId, delta, finalNote, finalReason);

  //     toast({ title: "Success", description: "Stock updated successfully!" });

  //     // Reset form
  //     setIsStockDialogOpen(false);
  //     setStockChange("");
  //     setStockNote("");
  //     setStockReason("");

  //     // --- PHẦN QUAN TRỌNG NHẤT: CẬP NHẬT UI TỨC THÌ (REAL-TIME) ---
  //     // 1. Cập nhật danh sách sản phẩm (để table bên ngoài cập nhật số tồn kho)
  //     queryClient.invalidateQueries({ queryKey: queryKeys.productsByClubId(clubId) });

  //     // 2. Cập nhật lịch sử kho (Stock History)
  //     queryClient.invalidateQueries({ queryKey: ["stockHistory", clubId, productId] });

  //     // 3. Cập nhật VÍ CLUB (Cập nhật số tiền trong Dialog hiện tại)
  //     queryClient.invalidateQueries({ queryKey: queryKeys.clubWallet(clubId) });

  //     // 4. [NEW] Cập nhật THÔNG TIN CLUB (Để Sidebar/Widget cập nhật nếu dùng hook useClub)
  //     queryClient.invalidateQueries({ queryKey: queryKeys.clubDetail(clubId) });

  //     // 5. [NEW] Cập nhật PROFILE (Giống trang Student - cập nhật nếu Sidebar dùng useFullProfile/useProfile)
  //     queryClient.invalidateQueries({ queryKey: queryKeys.profile });
  //     queryClient.invalidateQueries({ queryKey: queryKeys.fullProfile });

  //     // 6. Tải lại data sản phẩm hiện tại (để field Current Stock trong form cập nhật)
  //     await fetchProductData(clubId, productId);

  //   } catch (error: any) {
  //     toast({
  //       title: "Error",
  //       description: (error as any).response?.data?.message || error.message || "Failed to update stock.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsStockLoading(false);
  //   }
  // };
  // --- Handler Update Stock ---
  const handleUpdateStock = async () => {
    if (!clubId || !productId) return;

    const delta = parseFormattedNumber(stockChange);

    // Validate số lượng
    if (isNaN(delta) || delta === 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number (e.g. 50 or -10).",
        variant: "destructive",
      });
      return;
    }

    const isRemoving = delta < 0;

    // Validate Reason & Note
    if (isRemoving && !stockReason) {
      toast({ title: "Error", description: "Reason is required for removing stock.", variant: "destructive" });
      return;
    }
    if (!isRemoving && !stockNote.trim()) {
      toast({ title: "Error", description: "Note is required for adding stock.", variant: "destructive" });
      return;
    }

    setIsStockLoading(true);
    try {
      // 1. Chuẩn bị dữ liệu gửi đi
      const finalReason = isRemoving ? stockReason : undefined;
      let finalNote = stockNote.trim();

      if (isRemoving) {
        const reasonLabel = STOCK_REMOVAL_REASONS.find(r => r.value === stockReason)?.label || stockReason;
        finalNote = finalNote ? `[${reasonLabel}] - ${finalNote}` : `[${reasonLabel}]`;
      }

      // 2. Gọi API Update Stock
      await updateStock(clubId, productId, delta, finalNote, finalReason);

      toast({ title: "Success", description: "Stock updated successfully!" });

      // Reset form Dialog
      setIsStockDialogOpen(false);
      setStockChange("");
      setStockNote("");
      setStockReason("");

      // --- CẬP NHẬT UI TOÀN DIỆN (FIX TRIỆT ĐỂ VẤN ĐỀ KHÔNG RELOAD) ---
      // Chiến thuật: Invalidate Key Gốc (Root Key) để bắt trọn mọi biến thể (String/Number)

      await Promise.all([
        // 1. Quét sạch mọi query liên quan đến Ví Club (["club-wallet", ...])
        queryClient.invalidateQueries({ queryKey: ["club-wallet"] }),

        // 2. Quét sạch mọi query liên quan đến thông tin Club (["clubs", ...])
        // Sidebar thường lấy số dư từ API chi tiết Club (useClub)
        queryClient.invalidateQueries({ queryKey: ["clubs"] }),

        // 3. Quét sạch Profile (đề phòng Sidebar dùng useFullProfile như trang Student)
        queryClient.invalidateQueries({ queryKey: ["fullProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),

        // 4. Cập nhật dữ liệu sản phẩm & lịch sử trong trang hiện tại
        queryClient.invalidateQueries({ queryKey: queryKeys.productsByClubId(clubId) }),
        queryClient.invalidateQueries({ queryKey: ["stockHistory", clubId, productId] }),
      ]);

      // 5. Fetch lại data sản phẩm thủ công để chắc chắn form hiển thị đúng
      await fetchProductData(clubId, productId);

    } catch (error: any) {
      toast({
        title: "Error",
        description: (error as any).response?.data?.message || error.message || "Failed to update stock.",
        variant: "destructive",
      });
    } finally {
      setIsStockLoading(false);
    }
  };

  // Hook fetch Lịch sử Tồn kho
  const { data: stockHistory = [], isLoading: historyLoading } = useQuery<
    StockHistory[],
    Error
  >({
    queryKey: ["stockHistory", clubId, productId],
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

      // Báo cho trang list (nơi chúng ta sắp quay về) rằng dữ liệu đã cũ.
      queryClient.invalidateQueries({
        queryKey: queryKeys.productsByClubId(clubId),
      });

      // Chuyển hướng về trang danh sách
      router.push("/club-leader/gift");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to archive product.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // --- LOGIC TÍNH TOÁN NGÂN SÁCH KHI UPDATE STOCK ---
  // 1. Parse số lượng thay đổi
  const deltaStock = parseFormattedNumber(stockChange);
  const absDelta = Math.abs(deltaStock); // Lấy giá trị tuyệt đối để nhân giá tiền
  const unitPrice = product?.pointCost || 0;

  // 2. Kiểm tra xem đang thêm hàng (+) hay bớt hàng (-)
  const isAddingStock = deltaStock > 0;
  const isRemovingStock = deltaStock < 0;

  // 3. Xác định xem lý do xuất kho có được hoàn tiền không (Dựa trên ảnh Business Rule)
  // CORRECTION (Nhập sai) & RETURN_SUPPLIER (Trả hàng) => ĐƯỢC hoàn điểm
  const isRefundableReason = isRemovingStock && (stockReason === "CORRECTION" || stockReason === "RETURN_SUPPLIER");

  // 4. Tính toán số tiền
  // Chi phí phải trả khi nhập hàng
  const estimatedCost = isAddingStock ? (unitPrice * absDelta) : 0;
  // Số tiền được hoàn lại khi xuất hàng (nếu đúng lý do)
  const estimatedRefund = isRefundableReason ? (unitPrice * absDelta) : 0;

  // 5. Lấy số dư hiện tại
  const currentBalance = clubWallet?.balancePoints ?? 0;

  // 6. Tính số dư dự kiến sau giao dịch
  let projectedBalance = currentBalance;
  if (isAddingStock) {
    projectedBalance -= estimatedCost;
  } else if (isRemovingStock) {
    projectedBalance += estimatedRefund;
  }

  // 7. Kiểm tra đủ tiền (Chỉ cần check khi nhập hàng)
  const isBalanceSufficient = !isAddingStock || (estimatedCost <= currentBalance);

  if (loading && !product) {
    // Chỉ hiển thị skeleton khi tải lần đầu
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <LoadingSkeleton className="h-96" />
        </AppShell>
      </ProtectedRoute>
    );
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
    );
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 p-6 rounded-xl border-2 border-blue-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="hover:bg-white hover:text-black dark:hover:bg-slate-700 dark:bg-slate-800 dark:text-white dark:border-slate-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
              <Separator
                orientation="vertical"
                className="h-8 dark:bg-slate-700"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Edit Product
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isArchived ? (
                // 1. NẾU ĐÃ ARCHIVED: Hiển thị Badge
                <Badge
                  variant="destructive"
                  className="text-base py-2 px-4 shadow-lg"
                >
                  <Archive className="h-5 w-5 mr-2" />
                  Archived Product
                </Badge>
              ) : isEventExpired ? (
                // 2. NẾU LÀ EVENT EXPIRED: Hiển thị Badge cảnh báo với gradient và text trắng cho dark mode
                <div className="flex items-center w-full max-w-xs mx-auto bg-gradient-to-r from-indigo-600 to-fuchsia-700 text-white px-4 py-3 rounded-lg shadow-lg font-semibold justify-center gap-2">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Event Has Ended
                </div>
              ) : (
                // 3. NẾU CHƯA ARCHIVED VÀ CHƯA EXPIRED: Hiển thị nút Archive
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-red-200 dark:border-red-800 text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700"
                      disabled={isSaving || isDeleting}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Archive Product
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-lg dark:bg-slate-800 dark:border-slate-700">
                    <AlertDialogHeader>
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <Archive className="h-10 w-10 text-red-600 dark:text-red-400" />
                      </div>
                      <AlertDialogTitle className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Archive Product?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-center text-base space-y-4 pt-2">
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
                          <p className="text-gray-700 dark:text-gray-200 font-medium mb-2">
                            "{product?.name}"
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            will be permanently archived and:
                          </p>
                        </div>

                        <div className="space-y-2 text-left">
                          <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                            <div className="bg-red-100 dark:bg-red-900/30 p-1 rounded mt-0.5">
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <span className="text-sm">
                              Hidden from all students
                            </span>
                          </div>
                          <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                            <div className="bg-red-100 dark:bg-red-900/30 p-1 rounded mt-0.5">
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <span className="text-sm">
                              Cannot be redeemed or purchased
                            </span>
                          </div>
                          <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                            <div className="bg-red-100 dark:bg-red-900/30 p-1 rounded mt-0.5">
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <span className="text-sm">
                              Cannot be edited or restored
                            </span>
                          </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-3 mt-4">
                          <p className="text-amber-900 dark:text-amber-200 text-sm font-bold flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            This action is permanent and cannot be undone!
                          </p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-3 mt-2">
                      <AlertDialogCancel
                        disabled={isDeleting}
                        className="flex-1 h-11 border-2 hover:bg-gray-100 dark:hover:bg-slate-700 dark:border-slate-600"
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white shadow-lg"
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
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Cột trái: Thông tin chính */}
            <div className="md:col-span-3 space-y-6">
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500" />
                <CardHeader className="py-4 bg-gradient-to-br from-blue-200 to-blue-50 dark:from-blue-900/20 dark:via-slate-800/50 dark:to-slate-800 border-b border-blue-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                      <Package className="h-4 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold dark:text-white">
                      Product Details
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-base font-semibold dark:text-white"
                    >
                      Product Name{" "}
                      <span className="text-red-500 dark:text-red-400">*</span>
                    </Label>
                    <Input
                      id="name"
                      className="h-11 border-2 focus:border-blue-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder:text-slate-400 dark:focus:border-blue-400"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      disabled={isArchived}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-base font-semibold dark:text-white"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={6}
                      className="border-2 focus:border-blue-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder:text-slate-400 dark:focus:border-blue-400 resize-none"
                      placeholder="Enter a detailed description of your product..."
                      disabled={isArchived}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* CARD IMAGE */}
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500" />
                <CardHeader className="py-4 flex flex-row items-center justify-between bg-gradient-to-br from-purple-200 to-purple-50 dark:from-purple-900/20 dark:via-slate-800/50 dark:to-slate-800 border-b border-purple-200 dark:border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                      <ImageIcon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold dark:text-white">
                      Product Images
                    </CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMediaDialogOpen(true)}
                    disabled={isArchived}
                    className="border-2 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/30 hover:border-purple-400 dark:bg-slate-700 dark:text-white dark:border-slate-600"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Media
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {isMediaLoading && ( // Hiển thị loading khi đang thao tác media
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-20 rounded-lg backdrop-blur-sm">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                        <p className="text-sm text-muted-foreground dark:text-slate-300">
                          Processing...
                        </p>
                      </div>
                    </div>
                  )}
                  {product.media && product.media.length > 0 ? (
                    <ScrollArea className="w-full rounded-md border dark:border-slate-700">
                      <div className="flex w-max space-x-4 p-4">
                        {product.media.map((m) => (
                          <div
                            key={m.mediaId}
                            // Thêm w-40 (160px) và shrink-0 để các item không bị co lại
                            className="relative aspect-square w-40 group rounded-lg overflow-hidden border-2 border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-500 transition-all shrink-0"
                          >
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
                            <Badge
                              className={`absolute top-3 right-3 z-10 ${m.type === "VIDEO"
                                ? "bg-purple-500 text-white"
                                : "bg-blue-500 text-white"
                                } border-0 shadow-lg`}
                            >
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
                                  setSelectedMedia({
                                    url: m.url,
                                    type: m.type,
                                  });
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
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteMedia(m.mediaId);
                                    }}
                                  >
                                    <Trash className="h-5 w-5" />
                                  </Button>
                                  {!m.thumbnail && m.type !== "VIDEO" && (
                                    <Button
                                      variant="secondary"
                                      size="icon"
                                      className="h-10 w-10 shadow-lg hover:scale-110 transition-transform bg-yellow-400 hover:bg-yellow-500"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleSetThumbnail(m.mediaId);
                                      }}
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
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600">
                      <ImageIcon className="h-12 w-12 text-gray-400 dark:text-slate-400 mx-auto mb-3" />
                      <p className="text-muted-foreground dark:text-slate-300 font-medium">
                        No media uploaded yet
                      </p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                        Click "Upload Image" to add product photos or videos
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cột phải: Thông tin phụ */}
            <div className="md:col-span-2 space-y-6">
              {/* CARD STATUS & CLASSIFICATION */}
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
                {/* Gradient line */}
                <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500" />

                {/* HEADER */}
                <CardHeader className="py-4 bg-gradient-to-br from-orange-200 to-orange-50 dark:from-orange-900/20 dark:via-slate-800/50 dark:to-slate-800 border-b border-orange-200 dark:border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold dark:text-white">
                      Status & Classification
                    </CardTitle>
                  </div>
                </CardHeader>

                {/* CONTENT */}
                <CardContent className="space-y-4 pt-0 pb-0">
                  {/* GRID – always responsive */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PRODUCT STATUS */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold dark:text-white">
                        Product Status
                      </Label>

                      {isArchived ? (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
                          <Badge
                            variant="destructive"
                            className="text-base w-full justify-center py-2"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archived
                          </Badge>
                        </div>
                      ) : (
                        <Select
                          name="status"
                          value={form.status}
                          onValueChange={handleSelectChange("status")}
                        >
                          <SelectTrigger className="h-11 w-full border-2 border-slate-200 focus:border-orange-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:focus:border-orange-400">
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

                    {/* PRODUCT TYPE */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="type"
                        className="text-base font-semibold dark:text-white"
                      >
                        Product Type
                      </Label>

                      <Select
                        name="type"
                        value={form.type}
                        onValueChange={handleSelectChange("type")}
                      >
                        <SelectTrigger className="h-11 w-full border-2 border-slate-200 focus:border-orange-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:focus:border-orange-400">
                          <SelectValue placeholder="Select product type" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="CLUB_ITEM">Club Item</SelectItem>
                          <SelectItem value="EVENT_ITEM">Event Item</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* SELECT EVENT – RESPONSIVE – FULL WIDTH */}
                    {form.type === "EVENT_ITEM" && (
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-base font-semibold dark:text-white">
                          Select Event
                        </Label>

                        <Select
                          name="eventId"
                          value={String(form.eventId || "0")}
                          onValueChange={(value) =>
                            setForm({ ...form, eventId: Number(value) })
                          }
                          disabled
                        >
                          <SelectTrigger
                            className="h-11 w-full border-2 border-slate-200 focus:border-orange-500 
                dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:focus:border-orange-400"
                            title={
                              form.eventId
                                ? events.find((e) => e.id === form.eventId)
                                  ?.name
                                : "Select an event"
                            }
                          >
                            <SelectValue>
                              <span className="block truncate max-w-full">
                                {form.eventId
                                  ? events.find((e) => e.id === form.eventId)
                                    ?.name
                                  : "Select an event"}
                              </span>
                            </SelectValue>
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="0" disabled>
                              <span className="text-muted-foreground">
                                -- Select an event --
                              </span>
                            </SelectItem>

                            {events
                              .filter(
                                (e) =>
                                  e.status === "APPROVED" ||
                                  e.status === "ONGOING"
                              )
                              .map((event) => (
                                <SelectItem
                                  key={event.id}
                                  value={String(event.id)}
                                  title={event.name}
                                >
                                  <span className="truncate max-w-[300px] block">
                                    {event.name}
                                  </span>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CARD PRICE & INVENTORY */}
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-indigo-400 via-indigo-500 to-blue-500" />

                <CardHeader className="py-4 bg-gradient-to-br from-indigo-200 to-indigo-50 dark:from-indigo-900/20 dark:via-slate-800/50 dark:to-slate-800 border-b border-indigo-200 dark:border-slate-700 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                        <HandCoins className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold dark:text-white">
                        Price, Stock & Tags
                      </CardTitle>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsHistoryOpen(true)}
                        disabled={isArchived}
                        className="border-2 flex items-center gap-2 hover:bg-indigo-100 hover:text-indigo-700 
            dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-indigo-900/30"
                      >
                        <History className="h-4 w-4" />
                        <span>Stock History</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* GRID PRICE & STOCK */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PRICE */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold dark:text-white">
                        Price (Points) <span className="text-red-500">*</span>
                      </Label>

                      <Input
                        id="pointCost"
                        name="pointCost"
                        className="h-11 w-full border-2 border-slate-200 dark:bg-slate-700 dark:text-white dark:border-slate-600"
                        value={displayPrice}
                        onChange={handleChange}
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>

                    {/* STOCK */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold dark:text-white">
                          Current Stock
                        </Label>
                        {form.stockQuantity === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="stockQuantity"
                            className="h-11 w-full border-2 border-slate-200 dark:bg-slate-700 dark:text-white dark:border-slate-600 font-semibold text-lg"
                            value={form.stockQuantity}
                            readOnly
                          />
                          <Package className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-400" />
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsStockDialogOpen(true)}
                          className="h-11 w-11 border-2 dark:bg-slate-700 dark:text-white dark:border-slate-600"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6 dark:bg-slate-700" />

                  {/* TAGS */}
                  <div className="relative mb-4">
                    <Input
                      placeholder="Search tags..."
                      value={tagSearchTerm}
                      onChange={(e) => setTagSearchTerm(e.target.value)}
                      className="h-10 w-full border-2 border-slate-200 dark:bg-slate-700 dark:text-white dark:border-slate-600 pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-400" />
                  </div>

                  {allTags.length > 0 ? (
                    <ScrollArea className="h-52 rounded-lg border-2 p-4 bg-gray-50 dark:bg-slate-700/50 dark:border-slate-600">
                      <div className="space-y-3">
                        {allTags
                          .filter((tag) => {
                            // tag.name
                            //   .toLowerCase()
                            //   .includes(tagSearchTerm.toLowerCase())
                            const matchesSearch = tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase());

                            // Logic ẩn tag "new" (
                            const isNotNewTag = tag.name.toLowerCase() !== "new";

                            return matchesSearch && isNotNewTag;
                          })
                          .map((tag) => {
                            const isCoreTag =
                              tag.tagId === fixedTagIds.clubTagId ||
                              tag.tagId === fixedTagIds.eventTagId;

                            const isDisabled = isCoreTag || isArchived;

                            return (
                              <div
                                key={tag.tagId}
                                className="flex items-center space-x-3 p-2 rounded-md hover:bg-white dark:hover:bg-slate-600 transition-colors"
                              >
                                <Checkbox
                                  id={`tag-${tag.tagId}`}
                                  checked={form.tagIds.includes(tag.tagId)}
                                  onCheckedChange={(checked) =>
                                    handleTagChange(tag.tagId)(
                                      checked as boolean
                                    )
                                  }
                                  disabled={isDisabled}
                                  className="h-5 w-5"
                                />

                                <Label
                                  htmlFor={`tag-${tag.tagId}`}
                                  className={`font-medium flex-1 cursor-pointer dark:text-white ${isDisabled
                                    ? "text-muted-foreground dark:text-slate-400"
                                    : ""
                                    }`}
                                >
                                  {tag.name}

                                  {isCoreTag && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs dark:border-slate-500 dark:text-slate-300"
                                    >
                                      Auto
                                    </Badge>
                                  )}
                                </Label>
                              </div>
                            );
                          })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed dark:border-slate-600">
                      <Tag className="h-8 w-8 text-gray-400 dark:text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground dark:text-slate-400">
                        No tags available
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
          <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700">
            <DialogHeader>
              <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <DialogTitle className="text-center text-2xl dark:text-white">
                Upload Product Media
              </DialogTitle>
              <DialogDescription className="text-center dark:text-slate-300">
                Choose an image or video file to add to your product gallery.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="media-file"
                  className="text-base font-semibold dark:text-white"
                >
                  Select File
                </Label>
                <Input
                  id="media-file"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="border-2 focus:border-purple-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:focus:border-purple-400 cursor-pointer"
                />
                {newMediaFile && (
                  <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    {newMediaFile.type.startsWith("video/") ? (
                      <VideoIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                    )}
                    <span
                      className="text-sm font-medium text-purple-900 dark:text-purple-200 truncate flex-1 min-w-0"
                      title={newMediaFile.name}
                    >
                      {truncateFileName(newMediaFile.name, 40)}
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
                className="flex-1 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                disabled={isMediaLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMedia}
                disabled={isMediaLoading || !newMediaFile}
                className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white"
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
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col dark:bg-slate-800 dark:border-slate-700">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                  <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <DialogTitle className="text-2xl dark:text-white">
                    Stock History
                  </DialogTitle>
                  <DialogDescription className="text-base dark:text-slate-300">
                    {product.name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {/* Thêm flex-1 và overflow-hidden để ScrollArea hoạt động */}
            <div className="flex-1 overflow-hidden border-2 rounded-lg dark:border-slate-700">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {historyLoading ? (
                    <div className="space-y-3 py-4">
                      <Skeleton className="h-12 w-full dark:bg-slate-700" />
                      <Skeleton className="h-12 w-full dark:bg-slate-700" />
                      <Skeleton className="h-12 w-full dark:bg-slate-700" />
                    </div>
                  ) : stockHistory.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        <History className="h-10 w-10 text-gray-400 dark:text-slate-400" />
                      </div>
                      <p className="text-base text-muted-foreground dark:text-slate-300 font-medium">
                        No stock history found
                      </p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                        Stock changes will appear here
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-slate-700">
                          <TableHead className="w-[200px] font-bold dark:text-white">
                            Date & Time
                          </TableHead>
                          <TableHead className="text-center font-bold dark:text-white">
                            Change
                          </TableHead>
                          <TableHead className="text-center font-bold dark:text-white">
                            New Stock
                          </TableHead>
                          <TableHead className="font-bold dark:text-white">
                            Note
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockHistory.map((entry) => {
                          const change = entry.newStock - entry.oldStock;
                          const changeColor =
                            change > 0
                              ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30"
                              : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30";
                          const changeSign = change > 0 ? "+" : "";

                          return (
                            <TableRow
                              key={entry.id}
                              className="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                            >
                              <TableCell className="text-sm whitespace-nowrap font-medium dark:text-slate-200">
                                {new Date(entry.changedAt).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  className={`${changeColor} font-bold text-base px-3 py-1`}
                                >
                                  {changeSign}
                                  {change}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-bold text-lg dark:text-slate-200">
                                  {entry.newStock}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm dark:text-slate-300">
                                {entry.note || "N/A"}
                              </TableCell>
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
                className="w-full sm:w-auto dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Thêm hàng hóa */}
        {/* <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}> */}
        <Dialog open={isStockDialogOpen} onOpenChange={(open) => {
          setIsStockDialogOpen(open);
          if (!open) {
            // Reset khi đóng dialog
            setStockChange("");
            setStockNote("");
            setStockReason("");
          }
        }}>
          <DialogContent className="sm:max-w-lg dark:bg-slate-800 dark:border-slate-700">
            <DialogHeader>
              <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <DialogTitle className="text-center text-2xl dark:text-white">
                Update Stock
              </DialogTitle>
              <DialogDescription className="text-center dark:text-slate-300">
                Add or remove stock. Use a negative number to remove items.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="stockChange" className="text-base font-semibold dark:text-white">
                  Stock Change
                  <span className="text-red-500 dark:text-red-400">*</span>
                </Label>
                <Input
                  id="stockChange"
                  type="text"
                  inputMode="numeric"
                  value={stockChange}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Cho phép dấu âm chỉ ở đầu
                    const isNegative = value.startsWith("-");
                    // Chỉ lấy số
                    const numericValue = value.replace(/[^0-9]/g, "");
                    if (numericValue === "") {
                      setStockChange(isNegative ? "-" : "");
                      // Nếu xóa hết số, reset lý do
                      if (!isNegative) setStockReason("");
                      return;
                    }

                    const numberValue = parseInt(numericValue, 10);
                    const formattedValue = formatNumber(numberValue);

                    // Set lại giá trị (có dấu phẩy và dấu âm)
                    setStockChange(isNegative ? `-${formattedValue}` : formattedValue);
                  }}
                  placeholder="e.g., 50 (to add) or -10 (to remove)"
                  className="h-12 border-2 border-slate-300 focus:border-indigo-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder:text-slate-400 dark:focus:border-indigo-400 text-lg"
                />
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="bg-blue-100 dark:bg-blue-800/50 p-1 rounded">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-xs text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-1">Examples:</p>
                    <p>
                      • Type <span className="font-bold">50</span> to add 50 items
                    </p>
                    <p>
                      • Type <span className="font-bold">-10</span> to remove 10 items
                    </p>
                  </div>
                </div>
              </div>

              {/* --- NEW: DROPDOWN LÝ DO (CHỈ HIỆN KHI SỐ ÂM) --- */}
              {isRemovingStock && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-base font-semibold dark:text-white">
                    Reason for Removal <span className="text-red-500 dark:text-red-400">*</span>
                  </Label>
                  <Select value={stockReason} onValueChange={setStockReason}>
                    <SelectTrigger className="h-11 w-full border-2 border-slate-300 focus:border-indigo-500 dark:bg-slate-700 dark:text-white dark:border-slate-600">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {STOCK_REMOVAL_REASONS.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* NOTE INPUT */}
              <div className="space-y-2">
                <Label htmlFor="stockNote" className="text-base font-semibold dark:text-white">
                  Note
                  {/* --- UPDATE: Dấu sao chỉ hiện khi KHÔNG phải là xuất kho (tức là nhập kho) --- */}
                  {!isRemovingStock && <span className="text-red-500 dark:text-red-400"> *</span>}
                  {isRemovingStock && <span className="text-sm font-normal text-muted-foreground ml-1">(Optional)</span>}
                </Label>
                <Textarea
                  id="stockNote"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  placeholder={isRemovingStock
                    ? "Additional details (e.g., 'Broken during shipping')..."
                    : "e.g., 'Initial stock import' or 'Manual correction'"}
                  className="border-2 border-slate-300 focus:border-indigo-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder:text-slate-400 dark:focus:border-indigo-400 resize-none"
                  rows={4}
                />
              </div>

              {/* --- CHÈN CODE HIỂN THỊ TÍNH TOÁN VÀO ĐÂY (SAU TEXTAREA NOTE) --- */}
              {product && stockChange && (
                <div className={`p-4 rounded-lg border text-sm transition-all animate-in fade-in zoom-in duration-300 ${isAddingStock
                  ? (isBalanceSufficient ? "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700" : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800")
                  : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                  }`}>

                  {/* DÒNG 1: HIỂN THỊ SỐ TIỀN THAY ĐỔI (CHI PHÍ HOẶC HOÀN LẠI) */}
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-dashed border-gray-300 dark:border-gray-600">
                    <span className="text-muted-foreground dark:text-slate-400 font-medium">
                      {isAddingStock ? "Estimated Cost (Pay):" : "Estimated Refund (Receive):"}
                    </span>
                    <span className="font-bold text-base">
                      {isAddingStock ? (
                        /* Trường hợp nhập kho (+) -> Hiện số tiền phải trả */
                        <span className={isBalanceSufficient ? "text-slate-900 dark:text-white" : "text-red-600 dark:text-red-400"}>
                          - {formatNumber(estimatedCost)} pts
                        </span>
                      ) : (
                        /* Trường hợp xuất kho (-) -> Hiện số tiền nhận lại hoặc 0 */
                        isRefundableReason ? (
                          <span className="text-green-600 dark:text-green-400">
                            + {formatNumber(estimatedRefund)} pts
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            0 pts (No Refund)
                          </span>
                        )
                      )}
                    </span>
                  </div>

                  {/* GIẢI THÍCH CHI TIẾT NẾU XUẤT KHO */}
                  {isRemovingStock && stockReason && (
                    <div className="mb-2 text-xs italic text-right">
                      {isRefundableReason
                        ? <span className="text-green-600">Points returned to wallet ({stockReason})</span>
                        : <span className="text-orange-600">Loss/Internal use logic: No points returned</span>
                      }
                    </div>
                  )}

                  {/* DÒNG 2: SỐ DƯ VÍ */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground dark:text-slate-400 flex items-center gap-1">
                      <WalletCards className="w-4 h-4" /> Wallet Balance:
                    </span>
                    <div className="text-right">
                      {/* Số dư hiện tại -> Mũi tên -> Số dư mới */}
                      <span className="text-gray-500 line-through mr-2 text-xs">
                        {formatNumber(currentBalance)}
                      </span>
                      <span className={`font-bold ${projectedBalance < 0
                        ? "text-red-600"
                        : (projectedBalance > currentBalance ? "text-green-600" : "text-slate-900 dark:text-white")
                        }`}>
                        {formatNumber(projectedBalance)} pts
                      </span>
                    </div>
                  </div>

                  {/* Cảnh báo lỗi khi KHÔNG đủ tiền (Chỉ hiện khi nhập kho) */}
                  {!isBalanceSufficient && isAddingStock && (
                    <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800 flex items-center text-red-600 dark:text-red-400 text-xs font-bold">
                      <XCircle className="h-4 w-4 mr-1" />
                      Insufficient balance! You need {formatNumber(estimatedCost - currentBalance)} more points.
                    </div>
                  )}
                </div>
              )}

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
                className="flex-1 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStock}
                // --- UPDATE: THÊM ĐIỀU KIỆN !isBalanceSufficient ---
                disabled={
                  isStockLoading ||
                  parseFormattedNumber(stockChange) === 0 ||
                  !isBalanceSufficient ||
                  // --- UPDATE: Logic Disable Nút ---
                  (isRemovingStock ? !stockReason : !stockNote.trim())
                  // Nếu là âm: Phải chọn lý do. Nếu là dương: Phải nhập note.
                }
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white"
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
          <DialogContent className="max-w-[90vw] w-[90vw] max-h-[95vh] overflow-auto dark:bg-slate-800 dark:border-slate-700">
            <DialogHeader>
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <DialogTitle className="text-center text-2xl dark:text-white">
                Crop Image
              </DialogTitle>
              <DialogDescription className="text-center dark:text-slate-300">
                Drag and resize the selection to crop your image
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 px-6">
              <div className="border-2 border-gray-200 dark:border-slate-700 rounded-lg p-8 bg-gray-50 dark:bg-slate-900/50 w-full">
                <div className="flex justify-center w-full">
                  {imageSrc && (
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={undefined}
                      className="max-h-[75vh] w-full"
                      style={{ maxWidth: "100%" }}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop preview"
                        src={imageSrc}
                        style={{
                          maxHeight: "75vh",
                          width: "100%",
                          maxWidth: "100%",
                          objectFit: "contain",
                        }}
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
                className="flex-1 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCropComplete}
                disabled={!completedCrop}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
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
  );
}
