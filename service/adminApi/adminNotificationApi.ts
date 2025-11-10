import axiosInstance from "@/lib/axiosInstance";

// --- Cấu trúc dữ liệu chung ---

/**
 * Thông tin trạng thái queue
 * Dựa trên: GET /api/admin/notifications/status
 *
 * Ghi chú: Swagger hiển thị ví dụ là {"additionalProp1": {}, ...}
 * nhưng dựa trên mô tả "Kiểm tra số message",
 * kiểu dữ liệu này được hiểu là một đối tượng map tên queue với số lượng message.
 * Ví dụ: { "messageQueue": 10, "deadLetterQueue": 0 }
 */
export type AdminNotificationStatus = Record<string, number>;

// --- Hàm gọi API ---

/**
 * Lấy trạng thái (số lượng message) của các notification queue
 * Tương ứng với: GET /api/admin/notifications/status
 */
export const fetchAdminNotificationStatus = async () => {
  const response = await axiosInstance.get<AdminNotificationStatus>(
    `/api/admin/notifications/status`,
  );
  return response.data;
};