// file: service/adminApi/adminClubApi.ts

import axiosInstance from "@/lib/axiosInstance"

// --- Cấu trúc dữ liệu chung ---

/**
 * Cấu trúc dữ liệu phân trang chung
 * (Giống với các file API admin khác)
 */
export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number // Trang hiện tại (bắt đầu từ 0)
  last: boolean
  first: boolean
  numberOfElements: number
  empty: boolean
}

/**
 * Thông tin CLB (dùng cho cả danh sách và chi tiết)
 * Dựa trên: GET /api/admin/clubs và GET /api/admin/clubs/{id}
 */
export interface AdminClub {
  id: number
  name: string
  description: string
  majorName: string
  leaderName: string
  leaderEmail: string
  memberCount: number
  eventCount: number
  active: boolean
}

/**
 * Thông tin thống kê của CLB
 * Dựa trên: GET /api/admin/clubs/{id}/stats
 */
export interface AdminClubStats {
  clubId: number
  clubName: string
  leaderName: string
  memberCount: number
  totalEvents: number
  activeEvents: number
  completedEvents: number
  walletBalance: number
}

// --- Kiểu dữ liệu cho Tham số API ---

/**
 * Tham số cho API lấy danh sách CLB
 * Dựa trên: GET /api/admin/clubs
 */
export interface FetchAdminClubsParams {
  keyword?: string
  page?: number
  size?: number
}

// --- Hàm gọi API ---

/**
 * Lấy danh sách tất cả CLB (phân trang + tìm kiếm)
 * Tương ứng với: GET /api/admin/clubs
 * @param params Dữ liệu phân trang và tìm kiếm (keyword, page, size)
 */
export const fetchAdminClubs = async (params: FetchAdminClubsParams) => {
  const response = await axiosInstance.get<Page<AdminClub>>(
    `/api/admin/clubs`,
    { params }, // Gửi params qua query string
  )
  return response.data
}

/**
 * Lấy chi tiết một CLB bằng ID
 * Tương ứng với: GET /api/admin/clubs/{id}
 * @param id ID của CLB (path variable)
 */
export const fetchAdminClubDetail = async (id: number) => {
  const response = await axiosInstance.get<AdminClub>(
    `/api/admin/clubs/${id}`,
  )
  return response.data
}

/**
 * Lấy thông kê của một CLB bằng ID
 * Tương ứng với: GET /api/admin/clubs/{id}/stats
 * @param id ID của CLB (path variable)
 */
export const fetchAdminClubStats = async (id: number) => {
  const response = await axiosInstance.get<AdminClubStats>(
    `/api/admin/clubs/${id}/stats`,
  )
  return response.data
}

/**
 * Duyệt một CLB
 * Tương ứng với: PUT /api/admin/clubs/{id}/approve
 * @param id ID của CLB (path variable)
 */
export const approveAdminClub = async (id: number) => {
  const response = await axiosInstance.put(
    `/api/admin/clubs/${id}/approve`,
    null, // Không có body
  )
  return response.data // Thường là "OK" hoặc 200
}

/**
 * Tạm dừng hoạt động một CLB
 * Tương ứng với: PUT /api/admin/clubs/{id}/suspend
 * @param id ID của CLB (path variable)
 */
export const suspendAdminClub = async (id: number) => {
  const response = await axiosInstance.put(
    `/api/admin/clubs/${id}/suspend`,
    null, // Không có body
  )
  return response.data // Thường là "OK" hoặc 200
}