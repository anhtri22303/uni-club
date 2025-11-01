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
 * Dùng chung cho cả 3 API
 */
export interface RedeemOrder {
  orderId: number;
  orderCode: string;
  productName: string;
  quantity: number;
  totalPoints: number;
  status: string;
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