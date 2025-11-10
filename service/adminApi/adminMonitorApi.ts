import axiosInstance from "@/lib/axiosInstance";

// --- Cấu trúc dữ liệu chung ---

/**
 * Trạng thái sức khỏe hệ thống
 * Dựa trên: GET /api/admin/monitor/status
 */
export interface AdminMonitorStatus {
  databaseUp: boolean;
  redisUp: boolean;
  rabbitmqUp: boolean;
  cloudinaryUp: boolean;
  appVersion: string;
  environment: string;
  lastCheckedAt: string; // ISO date string (vd: "2025-11-10T10:30:00Z")
}

// --- Hàm gọi API ---

/**
 * Lấy trạng thái sức khỏe của các dịch vụ hệ thống
 * Tương ứng với: GET /api/admin/monitor/status
 */
export const fetchAdminMonitorStatus = async () => {
  const response = await axiosInstance.get<AdminMonitorStatus>(
    `/api/admin/monitor/status`,
  );
  return response.data;
};