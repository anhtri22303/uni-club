// file: adminUserApi.ts
import axiosInstance from "@/lib/axiosInstance";

// --- Interfaces ---

/**
 * Thông tin chi tiết của một người dùng (admin view)
 * Dựa trên response của GET /api/admin/users/{id}
 */
export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  majorName: string | null;
  active: boolean;
  joinedClubs: number;
}

/**
 * Cấu trúc dữ liệu phân trang chung
 */
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // Trang hiện tại (bắt đầu từ 0)
  last: boolean;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
  // Các trường khác như 'sort', 'pageable' có thể thêm nếu cần
}

/**
 * Kiểu dữ liệu trả về cho API lấy danh sách người dùng
 * Dựa trên response của GET /api/admin/users
 */
export type AdminUserPaginationResponse = Page<AdminUser>;

/**
 * Tham số cho API lấy danh sách người dùng
 */
export interface FetchAdminUsersParams {
  keyword?: string;
  page?: number;
  size?: number;
}

/**
 * Tham số cho API cập nhật role
 */
export interface UpdateUserRoleParams {
  id: number;
  roleName: string;
}

// --- API Functions ---

/**
 * Lấy danh sách tất cả người dùng (phân trang + tìm kiếm)
 * Tương ứng với: GET /api/admin/users
 *
 * @param params Dữ liệu phân trang và tìm kiếm (keyword, page, size)
 */
export const fetchAdminUsers = async (params: FetchAdminUsersParams) => {
  const response = await axiosInstance.get<AdminUserPaginationResponse>(
    `/api/admin/users`,
    { params } // Gửi keyword, page, size qua query params
  );
  return response.data;
};

/**
 * Xem chi tiết thông tin người dùng
 * Tương ứng với: GET /api/admin/users/{id}
 *
 * @param id ID của người dùng (path variable)
 */
export const fetchAdminUserDetails = async (id: number) => {
  const response = await axiosInstance.get<AdminUser>(
    `/api/admin/users/${id}`
  );
  return response.data;
};

/**
 * Admin đổi role của user
 * Tương ứng với: PUT /api/admin/users/{id}/role
 *
 * @param params Gồm { id, roleName }
 */
export const updateUserRole = async ({ id, roleName }: UpdateUserRoleParams) => {
  const response = await axiosInstance.put(
    `/api/admin/users/${id}/role`,
    null, // Không có request body
    { params: { roleName } } // Gửi roleName qua query param
  );
  return response.data;
};

/**
 * Khóa tài khoản người dùng
 * Tương ứng với: PUT /api/admin/users/{id}/ban
 *
 * @param id ID của người dùng (path variable)
 */
export const banUser = async (id: number) => {
  const response = await axiosInstance.put(
    `/api/admin/users/${id}/ban`
    // Không có body, không có query params
  );
  return response.data;
};

/**
 * Mở khóa tài khoản người dùng
 * Tương ứng với: PUT /api/admin/users/{id}/unban
 *
 * @param id ID của người dùng (path variable)
 */
export const unbanUser = async (id: number) => {
  const response = await axiosInstance.put(
    `/api/admin/users/${id}/unban`
    // Không có body, không có query params
  );
  return response.data;
};