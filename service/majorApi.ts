import axiosInstance from "@/lib/axiosInstance"

// [SỬA 1] Định nghĩa interface cho policy lồng bên trong (từ tin nhắn trước)
export interface MajorPolicy {
    id: number
    major: string
    policyName: string
    description: string
    maxClubJoin: number
    active: boolean
    majorName: string
}

// [SỬA 2] Thêm 'majorPolicy' vào interface Major (từ tin nhắn trước)
export interface Major {
    id: number
    name: string
    description: string
    majorCode: string
    active: boolean
    colorHex: string       // <-- Đã thêm
    policies: MajorPolicy[] // <-- Đã đổi từ majorPolicy (object) sang policies (array)
}


// --- Payload Types (Dùng cho Create/Update) ---
//  colorHex
export interface CreateMajorPayload {
    name: string
    description: string
    majorCode: string
    colorHex: string
}
export interface UpdateMajorPayload {
    name: string
    description: string
    majorCode: string
    active: boolean
    colorHex: string
}

//Payload cho việc cập nhật màu
export interface UpdateMajorColorPayload {
    colorHex: string
}

// [SỬA 3] Khôi phục lại hàm fetchMajors gốc CỦA BẠN, vì nó xử lý đúng wrapper
export const fetchMajors = async (): Promise<Major[]> => {
    try {
        const response = await axiosInstance.get<Major[]>("api/university/majors")
        return response.data // API trả về mảng trực tiếp
    } catch (error) {
        console.error("Error fetching majors:", error)
        throw error
    }
}

// (Các hàm còn lại giữ nguyên như cũ)
export const fetchMajorById = async (id: number): Promise<Major> => {
    try {
        const response = await axiosInstance.get<Major>(`api/university/majors/${id}`)
        return response.data
    } catch (error) {
        console.error(`Error fetching major ${id}:`, error)
        throw error
    }
}
/**
 * Lấy chi tiết ngành học theo Code
 */
export const fetchMajorByCode = async (code: string): Promise<Major> => {
    try {
        const response = await axiosInstance.get<Major>(`api/university/majors/code/${code}`)
        return response.data
    } catch (error) {
        console.error(`Error fetching major by code ${code}:`, error)
        throw error
    }
}

export const createMajor = async (payload: CreateMajorPayload): Promise<Major> => {
    try {
        const response = await axiosInstance.post<Major>("api/university/majors", payload)
        return response.data
    } catch (error) {
        console.error("Error creating major:", error)
        throw error
    }
}

export const updateMajorById = async (id: number, payload: UpdateMajorPayload): Promise<Major> => {
    try {
        const response = await axiosInstance.put<Major>(`api/university/majors/${id}`, payload)
        return response.data
    } catch (error) {
        console.error(`Error updating major ${id}:`, error)
        throw error
    }
}

/**
 * Cập nhật màu cho ngành học
 */
export const updateMajorColor = async (id: number, payload: UpdateMajorColorPayload): Promise<Major> => {
    try {
        const response = await axiosInstance.patch<Major>(`api/university/majors/${id}/color`, payload)
        return response.data
    } catch (error) {
        console.error(`Error updating major color ${id}:`, error)
        throw error
    }
}
/**
 * Xóa ngành học theo ID
 * API trả về 204 No Content
 */
export const deleteMajorById = async (id: number): Promise<void> => {
    try {
        await axiosInstance.delete(`api/university/majors/${id}`)
    } catch (error) {
        console.error(`Error deleting major ${id}:`, error)
        throw error
    }
}