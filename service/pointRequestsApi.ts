import axiosInstance from "@/lib/axiosInstance"
import { useQuery } from "@tanstack/react-query"

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
  status: "PENDING" | "APPROVED" | "REJECTED"
  staffNote: string | null // <-- Sửa: Cho phép null
  createdAt: string // <-- THÊM MỚI (từ Swagger)
  reviewedAt: string | null // <-- THÊM MỚI (từ Swagger)
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
  payload: CreatePointRequestPayload
): Promise<ApiResponse<PointRequest>> => {
  try {
    const response = await axiosInstance.post<ApiResponse<PointRequest>>(
      "/api/point-requests",
      payload
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
export const fetchPendingPointRequests = async (): Promise<
  ApiResponse<PointRequest[]>
> => {
  try {
    const response = await axiosInstance.get<ApiResponse<PointRequest[]>>(
      "/api/point-requests/pending"
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
  payload: ReviewPointRequestPayload
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
      }
    )
    return response.data
  } catch (error) {
    console.error(`Error reviewing point request ${id}:`, error)
    throw error
  }
}

/**
 * 4. Lấy TẤT CẢ các yêu cầu điểm (mọi trạng thái)
 * GET /api/point-requests/all
 */
export const fetchAllPointRequests = async (): Promise<
  ApiResponse<PointRequest[]>
> => {
  try {
    const response = await axiosInstance.get<ApiResponse<PointRequest[]>>(
      "/api/point-requests/all" // <-- Endpoint mới từ Swagger
    )
    return response.data
  } catch (error) {
    console.error("Error fetching all point requests:", error)
    throw error
  }
}

/**
 * 5. LẤY MỘT YÊU CẦU ĐIỂM THEO ID
 * GET /api/point-requests/{id}
 */
export const fetchPointRequestById = async (
  id: number | string
): Promise<ApiResponse<PointRequest>> => {
  try {
    const response = await axiosInstance.get<ApiResponse<PointRequest>>(
      `/api/point-requests/${id}` // <-- Endpoint mới từ Swagger
    )
    return response.data
  } catch (error) {
    console.error(`Error fetching point request by id ${id}:`, error)
    throw error
  }
}

// --- React Query Hooks ---

/**
 * Hook để gọi API số 4 (Lấy tất cả)
 * Đây là hook mà file page.tsx của bạn đang dùng
 */
export const usePointRequests = () => {
  return useQuery({
    queryKey: ["point-requests"],
    queryFn: fetchAllPointRequests, // <-- Sẽ gọi hàm số 4
  })
}

/**
 * Hook mới để gọi API số 5 (Lấy theo ID)
 */
export const usePointRequestById = (id: number | string | null) => {
  return useQuery({
    queryKey: ["point-request", id],
    queryFn: () => {
      if (!id) throw new Error("ID is required")
      return fetchPointRequestById(id)
    },
    enabled: !!id, // Chỉ chạy query khi ID tồn tại
  })
}