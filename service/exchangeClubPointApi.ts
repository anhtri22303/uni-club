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
  status: "PENDING" | "APPROVED" | "REJECTED";
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

// 1. GỬI ĐƠN XIN RÚT ĐIỂM CLB (POST /api/cashouts)
export const postCashoutRequest = async (payload: {
  clubId: number | string;
  points: number;
  note?: string;
}) => {
  try {
    const response = await axiosInstance.post<ApiResponse<CashoutResponse>>(
      "/api/cashouts",
      null, // Body để null vì tham số truyền qua query string theo hình ảnh
      {
        params: {
          clubId: payload.clubId,
          points: payload.points,
          note: payload.note,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error posting cashout request:", error.response?.data || error.message);
    throw error;
  }
};

// 2. XEM DANH SÁCH ĐƠN RÚT ĐIỂM CỦA CLB (GET /api/cashouts/my-club/{clubId})
export const getCashoutsByClubId = async (clubId: number | string) => {
  try {
    const response = await axiosInstance.get<ApiResponse<CashoutResponse[]>>(
      `/api/cashouts/my-club/${clubId}`
    );
    if (response.data?.success) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error(`Error fetching cashouts for club ${clubId}:`, error.response?.data || error.message);
    throw error;
  }
};

// 3. (ADMIN) XEM DANH SÁCH ĐƠN ĐANG CHỜ DUYỆT (GET /api/admin/cashouts/pending)
export const getPendingCashouts = async () => {
  try {
    const response = await axiosInstance.get<ApiResponse<CashoutResponse[]>>(
      "/api/admin/cashouts/pending"
    );
    if (response.data?.success) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching pending cashouts:", error.response?.data || error.message);
    throw error;
  }
};

// 4. (ADMIN) DUYỆT ĐƠN XIN RÚT ĐIỂM (POST /api/admin/cashouts/{id}/approve)
export const approveCashout = async (id: number | string, note?: string) => {
  try {
    const response = await axiosInstance.post<ApiResponse<any>>(
      `/api/admin/cashouts/${id}/approve`,
      null,
      {
        params: { note }, // Truyền note qua query
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error approving cashout:", error.response?.data || error.message);
    throw error;
  }
};

// 5. (ADMIN) TỪ CHỐI ĐƠN XIN RÚT ĐIỂM (POST /api/admin/cashouts/{id}/reject)
export const rejectCashout = async (id: number | string, reason: string) => {
  try {
    const response = await axiosInstance.post<ApiResponse<any>>(
      `/api/admin/cashouts/${id}/reject`,
      null,
      {
        params: { reason }, // Truyền reason qua query
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error rejecting cashout:", error.response?.data || error.message);
    throw error;
  }
};

// 6. (ADMIN) XEM DANH SÁCH ĐƠN RÚT ĐIỂM THEO TRẠNG THÁI
export const getAdminCashoutsByStatus = async (status: CashoutStatus) => {
  try {
    const response = await axiosInstance.get<ApiResponse<CashoutResponse[]>>(
      `/api/admin/cashouts/status/${status}`
    );
    if (response.data?.success) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error(`Error fetching admin cashouts with status ${status}:`, error.response?.data || error.message);
    throw error;
  }
};

// 7. XEM ĐƠN RÚT ĐIỂM CỦA CLB THEO TRẠNG THÁI
export const getMyClubCashoutsByStatus = async (
  clubId: number | string,
  status: CashoutStatus
) => {
  try {
    const response = await axiosInstance.get<ApiResponse<CashoutResponse[]>>(
      `/api/cashouts/my-club/${clubId}/status/${status}`
    );
    if (response.data?.success) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error(`Error fetching club ${clubId} cashouts with status ${status}:`, error.response?.data || error.message);
    throw error;
  }
};