import axiosInstance from "@/lib/axiosInstance";

// --- Cấu trúc dữ liệu chung ---

/**
 * Dữ liệu tổng hợp cho Admin Dashboard
 * Dựa trên: GET /api/admin/dashboard/summary
 */
export interface AdminDashboardSummary {
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
  totalRedeems: number;
  totalTransactions: number;
}

// --- Hàm gọi API ---

/**
 * Lấy dữ liệu tổng hợp cho Admin Dashboard
 * Tương ứng với: GET /api/admin/dashboard/summary
 */
export const fetchAdminDashboardSummary = async () => {
  const response = await axiosInstance.get<AdminDashboardSummary>(
    `/api/admin/dashboard/summary`,
  );
  return response.data;
};