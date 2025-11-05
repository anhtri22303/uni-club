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
  productType?: string; // 👈 HÃY THÊM DÒNG NÀY (nếu chưa có)
  status: string; // (PENDING, COMPLETED, CANCELLED, REFUNDED)
  createdAt: string;
  completedAt: string;
  clubName: string;
  memberName: string;
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

// --- API Functions ---

// === POST (Tạo đơn) ===

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
 * (MỚI) Lấy lịch sử các đơn hàng đổi quà của một Event
 * (GET /api/redeem/orders/event/{eventId})
 */
export async function getEventRedeemOrders(
  eventId: number | string
): Promise<RedeemOrder[]> {
  const res = await axiosInstance.get<ApiResponse<RedeemOrder[]>>(
    `/api/redeem/orders/event/${eventId}`
  );
  return res.data.data;
}

/**
 * (MỚI) Lấy lịch sử các đơn hàng đổi quà của chính member đang đăng nhập
 * (GET /api/redeem/orders/member)
 */
export async function getMemberRedeemOrders(): Promise<RedeemOrder[]> {
  const res = await axiosInstance.get<ApiResponse<RedeemOrder[]>>(
    `/api/redeem/orders/member`
  );
  return res.data.data;
}

// === PUT (Cập nhật trạng thái đơn) ===

/**
 * (MỚI) Hoàn thành một đơn hàng (chuyển status sang COMPLETED)
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
 * (MỚI) Hoàn trả toàn bộ đơn hàng (chuyển status sang REFUNDED)
 * (PUT /api/redeem/order/{orderId}/refund)
 */
export async function refundRedeemOrder(
  orderId: number | string
): Promise<RedeemOrder> {
  const res = await axiosInstance.put<ApiResponse<RedeemOrder>>(
    `/api/redeem/order/${orderId}/refund`
  );
  return res.data.data;
}

/**
 * (MỚI) Hoàn trả một phần đơn hàng
 * (PUT /api/redeem/order/{orderId}/refund-partial)
 */
export async function refundPartialRedeemOrder(
  orderId: number | string,
  quantity: number
): Promise<RedeemOrder> {
  const res = await axiosInstance.put<ApiResponse<RedeemOrder>>(
    `/api/redeem/order/${orderId}/refund-partial`,
    null, // Không có body
    { params: { quantity } } // Gửi `quantity` dưới dạng query param
  );
  return res.data.data;
}