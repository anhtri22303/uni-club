import axiosInstance from "@/lib/axiosInstance";

// --- Cấu trúc dữ liệu chung ---
// API này trả về một mảng các chuỗi (string[])
// đại diện cho các dòng log lỗi.
// Không cần định nghĩa interface phức tạp.

// --- Hàm gọi API ---

/**
 * Lấy 100 dòng lỗi gần nhất từ file log
 * Tương ứng với: GET /api/admin/logs/errors
 */
export const fetchAdminErrorLogs = async () => {
  const response = await axiosInstance.get<string[]>(
    `/api/admin/logs/errors`,
  );
  return response.data;
};