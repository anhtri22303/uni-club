import axiosInstance from "@/lib/axiosInstance";

// --- Cấu trúc dữ liệu chung ---

/**
 * Cấu trúc phản hồi API chuẩn
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Thông tin chi tiết một Multiplier Policy
 * Cập nhật dựa trên Swagger mới nhất (policyName, activityType, conditionType, etc.)
 */
export interface AdminMultiplierPolicy {
  id: number;
  policyName: string;
  policyDescription: string;
  targetType: "CLUB" | "MEMBER" | string;
  activityType: "SESSION_ATTENDANCE" | string;
  ruleName: string;
  conditionType: "ABSOLUTE" | string;
  minThreshold: number;
  maxThreshold: number;
  multiplier: number;
  active: boolean;
  updatedBy: string;
  updatedAt: string; // ISO date string
  effectiveFrom: string; // ISO date string
}

/**
 * Tham số cho hàm PATCH (Cập nhật hệ số)
 */
export interface UpdateMultiplierParams {
  id: number;
  newMultiplier: number;
}

// --- Hàm gọi API ---

/**
 * Lấy danh sách tất cả các multiplier policies
 * GET /api/admin/policies
 */
export const fetchAdminMultiplierPolicies = async () => {
  const response = await axiosInstance.get<ApiResponse<AdminMultiplierPolicy[]>>(
    `/api/admin/policies`
  );
  return response.data;
};

/**
 * Lấy chi tiết một multiplier policy theo ID
 * GET /api/admin/policies/{id}
 */
export const fetchAdminMultiplierPolicyById = async (id: number) => {
  const response = await axiosInstance.get<ApiResponse<AdminMultiplierPolicy>>(
    `/api/admin/policies/${id}`
  );
  return response.data;
};

/**
 * Tạo mới hoặc cập nhật một multiplier policy
 * POST /api/admin/policies
 */
export const saveAdminMultiplierPolicy = async (policy: Partial<AdminMultiplierPolicy>) => {
  const response = await axiosInstance.post<ApiResponse<AdminMultiplierPolicy>>(
    `/api/admin/policies`,
    policy
  );
  return response.data;
};

/**
 * Chỉnh sửa (PATCH) chỉ hệ số multiplier của policy
 * PATCH /api/admin/policies/{id}/multiplier?newMultiplier=...
 */
export const updateAdminPolicyMultiplier = async ({ id, newMultiplier }: UpdateMultiplierParams) => {
  const response = await axiosInstance.patch<ApiResponse<AdminMultiplierPolicy>>(
    `/api/admin/policies/${id}/multiplier`,
    null, // Không có request body
    { params: { newMultiplier } } // Gửi dưới dạng Query Parameter
  );
  return response.data;
};

/**
 * Xóa một multiplier policy theo ID
 * DELETE /api/admin/policies/{id}
 */
export const deleteAdminMultiplierPolicy = async (id: number) => {
  const response = await axiosInstance.delete<ApiResponse<string>>(
    `/api/admin/policies/${id}`
  );
  return response.data;
};