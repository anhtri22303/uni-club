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
  clubId?: number; 
  eventId?: number;
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
  console.log("Member redeem orders:", res.data.data);
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

