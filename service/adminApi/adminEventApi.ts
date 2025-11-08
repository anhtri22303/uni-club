// file: adminApi/adminEventApi.ts

import axiosInstance from "@/lib/axiosInstance"

// --- Cấu trúc dữ liệu chung ---

/**
 * Cấu trúc dữ liệu phân trang chung
 * (Giống hệt file adminProductsApi.ts)
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
 * Thông tin chi tiết của một sự kiện (Admin view)
 * Dựa trên response của GET /api/admin/events và GET /api/admin/events/{id}
 */
export interface AdminEvent {
    id: number
    title: string
    description: string
    clubName: string
    majorName: string
    startTime: string // ISO date string
    endTime: string // ISO date string
    status: string // (vd: "PENDING_COCLUB", "APPROVED", "REJECTED")
    totalParticipants: number
}

/**
 * Kiểu dữ liệu trả về cho API lấy danh sách sự kiện (phân trang)
 */
export type AdminEventPaginationResponse = Page<AdminEvent>

// --- Kiểu dữ liệu cho Tham số API ---

/**
 * Tham số cho API lấy danh sách sự kiện
 * GET /api/admin/events
 */
export interface FetchAdminEventsParams {
    keyword?: string
    page?: number
    size?: number
    status?: string // (vd: "APPROVED", "PENDING_UNISTAFF", "REJECTED")
    type?: "PUBLIC" | "PRIVATE" | string
    date?: string // (vd: "YYYY-MM-DD")
}

/**
 * Tham số cho API từ chối sự kiện
 * PUT /api/admin/events/{id}/reject
 */
export interface RejectEventParams {
    id: number
    reason?: string // (query param)
}

// --- Hàm gọi API ---

/**
 * Lấy danh sách tất cả sự kiện (phân trang + tìm kiếm)
 * Tương ứng với: GET /api/admin/events
 * @param params Dữ liệu phân trang và tìm kiếm (keyword, page, size)
 */
export const fetchAdminEvents = async (params: FetchAdminEventsParams) => {
    const response = await axiosInstance.get<AdminEventPaginationResponse>(
        `/api/admin/events`,
        { params }, // Gửi params qua query string
    )
    return response.data
}

/**
 * Lấy chi tiết một sự kiện bằng ID
 * Tương ứng với: GET /api/admin/events/{id}
 * @param id ID của sự kiện (path variable)
 */
export const fetchAdminEventDetail = async (id: number) => {
    const response = await axiosInstance.get<AdminEvent>(
        `/api/admin/events/${id}`,
    )
    return response.data
}

/**
 * Duyệt một sự kiện
 * Tương ứng với: PUT /api/admin/events/{id}/approve
 * @param id ID của sự kiện (path variable)
 */
export const approveAdminEvent = async (id: number) => {
    const response = await axiosInstance.put(
        `/api/admin/events/${id}/approve`,
        // Không có body
    )
    return response.data // Trả về "OK" hoặc data (nếu có)
}

/**
 * Từ chối một sự kiện
 * Tương ứng với: PUT /api/admin/events/{id}/reject
 * @param params Gồm ID (path variable) và reason (query param)
 */
export const rejectAdminEvent = async ({ id, reason }: RejectEventParams) => {
    const response = await axiosInstance.put(
        `/api/admin/events/${id}/reject`,
        null, // Không có body (data)
        { params: { reason } }, // Gửi 'reason' qua query params
    )
    return response.data
}