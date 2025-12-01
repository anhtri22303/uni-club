import axiosInstance from "../lib/axiosInstance";

/**
 * Cấu trúc response API chuẩn
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// --- Interfaces ---

/**
 * Interface cho đối tượng Order (Đơn hàng đổi quà)
 * Dùng chung cho tất cả API
 */
export interface RedeemOrder {
  orderId: number;
  orderCode: string;
  productName: string;
  quantity: number;
  totalPoints: number;
  productType?: string;
  status: string; // (PENDING, COMPLETED, REFUNDED, PARTIALLY_REFUNDED)
  createdAt: string;
  completedAt: string; // Có thể null
  clubName: string;
  memberName: string;
  reasonRefund?: string;
  refundImages?: string[];
  clubId?: number;
  eventId?: number;
  membershipId?: number; // ID của membership (user trong club)
}

/**
 *  Interface cho item đơn hàng trong danh sách Admin
 * (Response từ GET /api/admin/products/orders)
 */
export interface AdminRedeemOrderItem {
  id: number;
  productName: string;
  buyerName: string;
  clubName: string;
  quantity: number;
  totalPoints: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  orderCode: string;
  qrCodeBase64: string;
}

/**
 *  Interface cho cấu trúc phân trang chuẩn (Spring Page)
 * (Response từ GET /api/admin/products/orders)
 */
export interface PaginationResponse<T> {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  size: number;
  number: number; // Trang hiện tại (bắt đầu từ 0)
  numberOfElements: number;
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
    sort: {
      direction: string;
      nullHandling: string;
      ascending: boolean;
      property: string;
      ignoreCase: boolean;
    }[];
  };
  sort: {
    direction: string;
    nullHandling: string;
    ascending: boolean;
    property: string;
    ignoreCase: boolean;
  }[];
}

/**
 *  Interface cho tham số phân trang
 */
export interface PaginationParams {
  page: number;
  size: number;
}

/**
 * Interface cho payload (dữ liệu gửi đi) khi đổi quà
 * Dùng cho cả Club Item và Event Item
 */
export interface RedeemPayload {
  productId: number;
  quantity: number;
  membershipId: number;
}

/**
 * Interface cho payload (dữ liệu gửi đi) khi HOÀN TRẢ
 * Dùng cho cả Full và Partial Refund
 */
export interface RefundPayload {
  orderId: number | string;
  quantityToRefund: number;
  reason: string;
}

/**
 * Interface cho đối tượng ảnh lỗi (Refund Image)
 * (Response từ GET /api/redeem/order/{orderId}/refund/images)
 */
export interface RefundImage {
  id: number;
  imageUrl: string;
  publicId: string;
  displayOrder: number;
}

// --- API Functions ---

/**
 * Đổi một sản phẩm của Club (Club Item)
 * (POST /api/redeem/club/{clubId}/order)
 */
export async function redeemClubProduct(
  clubId: number | string,
  payload: RedeemPayload
): Promise<RedeemOrder> {
  const res = await axiosInstance.post<ApiResponse<RedeemOrder>>(
    `/api/redeem/club/${clubId}/order`,
    payload
  );
  console.log("Redeem club product response:", res.data);
  return res.data.data;
}

/**
 * Đổi một sản phẩm của Event (Event Item)
 * (POST /api/redeem/event/{eventId}/redeem)
 */
export async function redeemEventProduct(
  eventId: number | string,
  payload: RedeemPayload
): Promise<RedeemOrder> {
  const res = await axiosInstance.post<ApiResponse<RedeemOrder>>(
    `/api/redeem/event/${eventId}/redeem`,
    payload
  );
  return res.data.data;
}

// === GET (Lấy danh sách đơn) ===

/**
 *  [ADMIN] Lấy tất cả đơn hàng đổi quà (phân trang)
 * (GET /api/admin/products/orders)
 */
export async function getAdminAllRedeemOrders(
  params: PaginationParams
): Promise<PaginationResponse<AdminRedeemOrderItem>> {

  // 1. Sửa kiểu dữ liệu mong đợi (bỏ ApiResponse)
  const res = await axiosInstance.get<
    PaginationResponse<AdminRedeemOrderItem>
  >(`/api/admin/products/orders`, {
    params: params, // Gửi page và size dưới dạng query params
  });
  // 2. Trả về res.data trực tiếp (thay vì res.data.data)
  return res.data;
}

/**
 * Lấy lịch sử các đơn hàng đổi quà của một Club
 * (GET /api/redeem/orders/club/{clubId})
 */
export async function getClubRedeemOrders(
  clubId: number | string
): Promise<RedeemOrder[]> {
  const res = await axiosInstance.get<ApiResponse<RedeemOrder[]>>(
    `/api/redeem/orders/club/${clubId}`
  );
  return res.data.data;
}

/**
 * Lấy tất cả đơn hàng Event của một Club
 * (GET /api/redeem/event/club/{clubId})
 */
export async function getEventRedeemOrders(
  clubId: number | string
): Promise<RedeemOrder[]> {
  const res = await axiosInstance.get<ApiResponse<RedeemOrder[]>>(
    `/api/redeem/event/club/${clubId}`
  );
  console.log("Event redeem orders for club:", res.data.data);
  return res.data.data;
}

/**
 *  Lấy lịch sử các đơn hàng đổi quà của chính member đang đăng nhập
 * (GET /api/redeem/orders/member)
 */
export async function getMemberRedeemOrders(): Promise<RedeemOrder[]> {
  const res = await axiosInstance.get<ApiResponse<RedeemOrder[]>>(
    `/api/redeem/orders/member`
  );
  console.log("Member redeem orders:", res.data.data);
  return res.data.data;
}

// === PUT (Cập nhật trạng thái đơn) ===

/**
 *  Lấy thông tin chi tiết đơn hàng theo orderId
 * (GET /api/redeem/orders/{orderId})
 */
export async function getRedeemOrderById(
  orderId: number | string
): Promise<RedeemOrder> {
  const res = await axiosInstance.get<ApiResponse<RedeemOrder>>(
    `/api/redeem/order/id/${orderId}`
  );
  console.log("Redeem order by ID:", res.data.data);
  return res.data.data;
}

/**
 *  Lấy thông tin chi tiết đơn hàng theo orderCode (QR Scan)
 * (GET /api/redeem/orders/{orderCode})
 */
export async function getRedeemOrderByOrderCode(
  orderCode: string
): Promise<RedeemOrder> {
  const res = await axiosInstance.get<ApiResponse<RedeemOrder>>(
    `/api/redeem/orders/${orderCode}`
  );
  return res.data.data;
}

/**
 *  Hoàn thành một đơn hàng (chuyển status sang COMPLETED)
 * (PUT /api/redeem/order/{orderId}/complete)
 */
export async function completeRedeemOrder(
  orderId: number | string
): Promise<RedeemOrder> {
  const res = await axiosInstance.put<ApiResponse<RedeemOrder>>(
    `/api/redeem/order/${orderId}/complete`
  );
  return res.data.data;
}

/**
 * (CẬP NHẬT) Hoàn trả toàn bộ đơn hàng (chuyển status sang REFUNDED)
 * (PUT /api/redeem/order/{orderId}/refund)
 */
export async function refundRedeemOrder(
  payload: RefundPayload
): Promise<RedeemOrder> {
  const res = await axiosInstance.put<ApiResponse<RedeemOrder>>(
    `/api/redeem/order/refund`,
    payload
  );
  return res.data.data;
}

/**
 * (CẬP NHẬT) Hoàn trả một phần đơn hàng
 * (PUT /api/redeem/order/{orderId}/refund-partial)
 */
export async function refundPartialRedeemOrder(
  payload: RefundPayload
): Promise<RedeemOrder> {
  const res = await axiosInstance.put<ApiResponse<RedeemOrder>>(
    `/api/redeem/order/refund-partial`,
    payload
  );
  return res.data.data;
}

// === QUẢN LÝ ẢNH REFUND (GET & DELETE) ===

/**
 * Upload ảnh lỗi sản phẩm khi hoàn hàng (Refund)
 * (POST /api/redeem/order/{orderId}/refund/upload-images)
 * Lưu ý: Tối đa 5 ảnh.
 */
export async function uploadRefundImages(
  orderId: number | string,
  files: File[]
): Promise<string[]> {
  const formData = new FormData();

  // Duyệt qua mảng file và append vào key 'files' theo yêu cầu API
  files.forEach((file) => {
    formData.append("files", file);
  });

  const res = await axiosInstance.post<ApiResponse<string[]>>(
    `/api/redeem/order/${orderId}/refund/upload-images`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  // Trả về danh sách URL ảnh
  return res.data.data;
}

/**
 * Lấy danh sách ảnh lỗi đã upload của một Order
 * (GET /api/redeem/order/{orderId}/refund/images)
 */
export async function getRefundImages(
  orderId: number | string
): Promise<RefundImage[]> {
  const res = await axiosInstance.get<ApiResponse<RefundImage[]>>(
    `/api/redeem/order/${orderId}/refund/images`
  );
  return res.data.data;
}

/**
 * Xóa một ảnh lỗi cụ thể
 * (DELETE /api/redeem/order/{orderId}/refund/image/{imageId})
 */
export async function deleteRefundImage(
  orderId: number | string,
  imageId: number | string
): Promise<string> {
  const res = await axiosInstance.delete<ApiResponse<string>>(
    `/api/redeem/order/${orderId}/refund/image/${imageId}`
  );
  // Trả về message hoặc data string từ server
  return res.data.data;
}

// === ORDER LOGS (Lịch sử thay đổi trạng thái đơn hàng) ===

/**
 * Interface cho Order Log (Lịch sử trạng thái đơn hàng)
 * (Response từ GET /api/order-logs/membership/{membershipId}/order/{orderId})
 */
export interface OrderLog {
  id: number;
  action: string; // COMPLETED, REFUND, PARTIAL_REFUND, etc.
  actorId: number;
  actorName: string;
  targetUserId: number;
  targetUserName: string;
  orderId: number;
  quantity: number;
  pointsChange: number;
  reason: string | null;
  createdAt: string;
}

/**
 * Lấy lịch sử thay đổi trạng thái của một đơn hàng
 * (GET /api/order-logs/membership/{membershipId}/order/{orderId})
 */
export async function getOrderLogsByMembershipAndOrder(
  membershipId: number | string,
  orderId: number | string
): Promise<OrderLog[]> {
  try {
    const url = `/api/order-logs/membership/${membershipId}/order/${orderId}`;
    console.log("🌐 Calling API:", url);
    console.log("🔑 Full URL:", `${axiosInstance.defaults.baseURL}${url}`);
    
    const res = await axiosInstance.get<OrderLog[] | ApiResponse<OrderLog[]>>(url);
    
    console.log("📡 Response status:", res.status);
    console.log("📡 Response headers:", res.headers);
    console.log("🔍 Raw response data:", res.data);
    console.log("🔍 Response data type:", typeof res.data);
    console.log("🔍 Is array?:", Array.isArray(res.data));
    
    // Check if response is wrapped in ApiResponse or direct array
    if (Array.isArray(res.data)) {
      // Direct array response
      console.log("✅ Order logs (direct array):", res.data);
      console.log("✅ Number of logs:", res.data.length);
      return res.data as OrderLog[];
    } else if ('data' in res.data && Array.isArray(res.data.data)) {
      // Wrapped in ApiResponse
      console.log("✅ Order logs (wrapped):", res.data.data);
      console.log("✅ Number of logs:", res.data.data.length);
      return res.data.data;
    } else {
      console.warn("⚠️ Unexpected response format:", res.data);
      return [];
    }
  } catch (error: any) {
    console.error("❌ Error calling order logs API:", error);
    console.error("❌ Error response:", error?.response?.data);
    console.error("❌ Error status:", error?.response?.status);
    throw error;
  }
}
