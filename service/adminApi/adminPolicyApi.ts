import axiosInstance from "@/lib/axiosInstance";

// --- Cấu trúc dữ liệu chung ---

/**
 * Cấu trúc phản hồi API chuẩn
 * (Dùng cho tất cả các hàm)
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Thông tin chi tiết một Multiplier Policy
 * Dựa trên: GET /api/admin/policies/{id} và POST /api/admin/policies
 */
export interface AdminMultiplierPolicy {
  id: number;
  name: string;
  description: string;
  targetType: string; // vd: "CLUB" hoặc "MEMBER"
  levelOrStatus: string;
  minEvents: number;
  multiplier: number;
  active: boolean;
  updatedBy: string; // Tên người cập nhật
  updatedAt: string; // ISO date string
  effectiveFrom: string; // ISO date string
}

/**
 * Tham số cho hàm PATCH
 */
export interface UpdateMultiplierParams {
  id: number;
  newMultiplier: number;
}

// --- Hàm gọi API ---

/**
 * Lấy danh sách tất cả các multiplier policies (CLUB / MEMBER)
 * Tương ứng với: GET /api/admin/policies
 */
export const fetchAdminMultiplierPolicies = async () => {
  // SỬA LỖI: API này trả về một đối tượng bọc (wrapper), không phải mảng trực tiếp
  const response = await axiosInstance.get<ApiResponse<AdminMultiplierPolicy[]>>(
    `/api/admin/policies`,
  );
  // Trả về toàn bộ đối tượng { success, message, data: [...] }
  return response.data;
};

/**
 * Lấy chi tiết một multiplier policy theo ID
 * Tương ứng với: GET /api/admin/policies/{id}
 * @param id ID của policy
 */
export const fetchAdminMultiplierPolicyById = async (id: number) => {
  // API này DÙNG wrapper
  const response = await axiosInstance.get<ApiResponse<AdminMultiplierPolicy>>(
    `/api/admin/policies/${id}`,
  );
  return response.data; // Trả về { success, message, data: {...} }
};

/**
 * Tạo mới hoặc cập nhật một multiplier policy
 * Tương ứng với: POST /api/admin/policies
 * @param policy Dữ liệu policy để lưu (gửi trong request body)
 */
export const saveAdminMultiplierPolicy = async (policy: AdminMultiplierPolicy) => {
  // API này DÙNG wrapper
  const response = await axiosInstance.post<ApiResponse<AdminMultiplierPolicy>>(
    `/api/admin/policies`,
    policy,
  );
  return response.data;
};

/**
 * Chỉnh sửa (PATCH) chỉ hệ số multiplier của policy
 * Tương ứng với: PATCH /api/admin/policies/{id}/multiplier
 * @param params Gồm id (path) và newMultiplier (query)
 */
export const updateAdminPolicyMultiplier = async ({ id, newMultiplier }: UpdateMultiplierParams) => {
  // API này DÙNG wrapper
  const response = await axiosInstance.patch<ApiResponse<AdminMultiplierPolicy>>(
    `/api/admin/policies/${id}/multiplier`,
    null, // Không có body
    { params: { newMultiplier } }, // Gửi qua query params
  );
  return response.data; // Trả về { success, message, data: {...} }
};

/**
 * Xóa một multiplier policy theo ID
 * Tương ứng với: DELETE /api/admin/policies/{id}
 * @param id ID của policy cần xóa
 */
export const deleteAdminMultiplierPolicy = async (id: number) => {
  // API này DÙNG wrapper
  const response = await axiosInstance.delete<ApiResponse<string>>(
    `/api/admin/policies/${id}`,
  );
  return response.data; // Trả về { success, message, data: "..." }
};