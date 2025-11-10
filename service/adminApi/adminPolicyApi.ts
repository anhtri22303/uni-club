import axiosInstance from "@/lib/axiosInstance";

// --- Cấu trúc dữ liệu chung ---

/**
 * Thông tin Chính sách (Policy)
 * Dựa trên: GET & POST /api/admin/policies
 */
export interface AdminPolicy {
  id: number;
  name: string;
  description: string;
  type: string; // vd: "MAJOR", "MULTIPLIER"
  active: boolean;
}

// --- Hàm gọi API ---

/**
 * Lấy danh sách tất cả các chính sách
 * Tương ứng với: GET /api/admin/policies
 */
export const fetchAdminPolicies = async () => {
  const response = await axiosInstance.get<AdminPolicy[]>(
    `/api/admin/policies`,
  );
  return response.data;
};

/**
 * Thêm hoặc cập nhật một chính sách
 * Tương ứng với: POST /api/admin/policies
 * @param policy Dữ liệu chính sách để lưu (gửi trong request body)
 */
export const saveAdminPolicy = async (policy: AdminPolicy) => {
  const response = await axiosInstance.post<AdminPolicy>(
    `/api/admin/policies`,
    policy, // Dữ liệu gửi trong body
  );
  return response.data;
};

/**
 * Xóa một chính sách bằng ID
 * Tương ứng với: DELETE /api/admin/policies/{id}
 * @param id ID của chính sách (path variable)
 */
export const deleteAdminPolicy = async (id: number) => {
  const response = await axiosInstance.delete(`/api/admin/policies/${id}`);
  return response.data; // Thường chỉ trả về 200 OK
};