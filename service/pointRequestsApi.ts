import axiosInstance from "@/lib/axiosInstance"

// --- Generic API Response Wrapper ---
// Dựa trên cấu trúc trả về trong Swagger
export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

// --- Data Types (Dùng cho responses) ---

// Đại diện cho một yêu cầu điểm (dựa trên GET và POST response)
export interface PointRequest {
    id: number
    clubName: string
    requestedPoints: number
    reason: string
    status: "PENDING" | "APPROVED" | "REJECTED" // Mở rộng status
    staffNote: string
}

// --- Payload Types (Dùng cho Create/Update) ---

// Payload để TẠO một point request (dựa trên POST body)
export interface CreatePointRequestPayload {
    clubId: number
    requestedPoints: number
    reason: string
}

// Payload (dưới dạng query params) để REVIEW một point request (dựa trên PUT params)
export interface ReviewPointRequestPayload {
    approve: boolean
    note?: string // 'note' là không bắt buộc
}

// --- API Functions ---

/**
 * 1. Tạo một yêu cầu xin điểm mới
 * POST /api/point-requests
 */
export const createPointRequest = async (
    payload: CreatePointRequestPayload,
): Promise<ApiResponse<PointRequest>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<PointRequest>>(
            "/api/point-requests",
            payload,
        )
        return response.data
    } catch (error) {
        console.error("Error creating point request:", error)
        throw error
    }
}

/**
 * 2. Lấy tất cả các yêu cầu điểm đang chờ (pending)
 * GET /api/point-requests/pending
 */
export const fetchPendingPointRequests = async (): Promise<ApiResponse<PointRequest[]>> => {
    try {
        const response = await axiosInstance.get<ApiResponse<PointRequest[]>>(
            "/api/point-requests/pending",
        )
        return response.data
    } catch (error) {
        console.error("Error fetching pending point requests:", error)
        throw error
    }
}

/**
 * 3. Duyệt (approve/reject) một yêu cầu điểm
 * PUT /api/point-requests/{id}/review
 */
export const reviewPointRequest = async (
    id: number,
    payload: ReviewPointRequestPayload,
): Promise<ApiResponse<string>> => {
    try {
        // Dữ liệu (approve, note) được gửi dưới dạng query parameters, không phải body
        const response = await axiosInstance.put<ApiResponse<string>>(
            `/api/point-requests/${id}/review`,
            null, // Không có body cho request này
            {
                params: {
                    approve: payload.approve,
                    note: payload.note,
                },
            },
        )
        return response.data
    } catch (error) {
        console.error(`Error reviewing point request ${id}:`, error)
        throw error
    }
}
/**
 * 4. Lấy TẤT CẢ các yêu cầu điểm (mọi trạng thái)
 * GET /api/point-requests
 */
export const fetchAllPointRequests = async (): Promise<ApiResponse<PointRequest[]>> => {
    try {
        const response = await axiosInstance.get<ApiResponse<PointRequest[]>>(
            "/api/point-requests" // Giả sử đây là endpoint lấy tất cả
        )
        return response.data
    } catch (error) {
        console.error("Error fetching all point requests:", error)
        throw error
    }
}

// ... (bạn cũng nên tạo một hook cho tiện)
import { useQuery } from "@tanstack/react-query"

export const usePointRequests = () => {
    return useQuery({
        queryKey: ["point-requests"],
        queryFn: fetchAllPointRequests,
    })
}
    