import axiosInstance from "@/lib/axiosInstance";

export type CashoutStatus = "PENDING" | "APPROVED" | "REJECTED";

// Định nghĩa Interface cho dữ liệu Cashout
export interface CashoutResponse {
  id: number;
  clubId: number;
  clubName: string;
  requestedById: number;
  requestedByName: string;
  pointsRequested: number;
  cashAmount: number;
  status: CashoutStatus;
  leaderNote: string;
  staffNote: string;
  requestedAt: string;
  reviewedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** * NHÓM API DÀNH CHO CLUB LEADER
 */

// 1. Gửi đơn xin rút điểm CLB (POST /api/cashouts)
export const postCashoutRequest = async (payload: {
  clubId: number | string;
  points: number;
  note?: string;
}) => {
  const response = await axiosInstance.post<ApiResponse<CashoutResponse>>(
    "/api/cashouts",
    null,
    { params: payload }
  );
  return response.data;
};

// 2. Xem chi tiết một đơn rút điểm (GET /api/cashouts/{id})
export const getCashoutDetail = async (id: number | string) => {
  const response = await axiosInstance.get<ApiResponse<CashoutResponse>>(
    `/api/cashouts/${id}`
  );
  return response.data;
};

// 3. Xem danh sách đơn rút điểm của CLB mình (GET /api/cashouts/my-club/{clubId})
export const getCashoutsByClubId = async (clubId: number | string) => {
  const response = await axiosInstance.get<ApiResponse<CashoutResponse[]>>(
    `/api/cashouts/my-club/${clubId}`
  );
  return response.data.data || [];
};

// 4. Xem lịch sử đơn rút điểm đã xử lý (Approved/Rejected) của CLB (GET /api/cashouts/my-club/{clubId}/history)
export const getMyClubCashoutHistory = async (clubId: number | string) => {
  const response = await axiosInstance.get<ApiResponse<CashoutResponse[]>>(
    `/api/cashouts/my-club/${clubId}/history`
  );
  return response.data.data || [];
};

/** * NHÓM API DÀNH CHO STAFF / ADMIN
 */

// 5. Xem TẤT CẢ đơn rút điểm trong hệ thống (GET /api/admin/cashouts)
export const getAllAdminCashouts = async () => {
  const response = await axiosInstance.get<ApiResponse<CashoutResponse[]>>(
    "/api/admin/cashouts"
  );
  return response.data.data || [];
};

// 6. Xem danh sách đơn rút điểm ĐANG CHỜ DUYỆT (GET /api/admin/cashouts/pending)
export const getAdminPendingCashouts = async () => {
  const response = await axiosInstance.get<ApiResponse<CashoutResponse[]>>(
    "/api/admin/cashouts/pending"
  );
  return response.data.data || [];
};

// 7. Xem danh sách đơn rút điểm ĐÃ DUYỆT (GET /api/admin/cashouts/approved)
export const getAdminApprovedCashouts = async () => {
  const response = await axiosInstance.get<ApiResponse<CashoutResponse[]>>(
    "/api/admin/cashouts/approved"
  );
  return response.data.data || [];
};

// 8. Xem danh sách đơn rút điểm BỊ TỪ CHỐI (GET /api/admin/cashouts/rejected)
export const getAdminRejectedCashouts = async () => {
  const response = await axiosInstance.get<ApiResponse<CashoutResponse[]>>(
    "/api/admin/cashouts/rejected"
  );
  return response.data.data || [];
};

// 9. Duyệt đơn xin rút điểm (POST /api/admin/cashouts/{id}/approve)
export const approveCashout = async (id: number | string, note?: string) => {
  const response = await axiosInstance.post<ApiResponse<any>>(
    `/api/admin/cashouts/${id}/approve`,
    null,
    { params: { note } }
  );
  return response.data;
};

// 10. Từ chối đơn xin rút điểm (POST /api/admin/cashouts/{id}/reject)
export const rejectCashout = async (id: number | string, reason: string) => {
  const response = await axiosInstance.post<ApiResponse<any>>(
    `/api/admin/cashouts/${id}/reject`,
    null,
    { params: { reason } }
  );
  return response.data;
};