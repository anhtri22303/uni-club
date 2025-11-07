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
    majorPolicy: MajorPolicy | null // Thêm trường này
}

// --- Payload Types (Dùng cho Create/Update) ---
export interface CreateMajorPayload {
    name: string
    description: string
    majorCode: string
}

export interface UpdateMajorPayload {
    name: string
    description: string
    majorCode: string
    active: boolean
}

// [SỬA 3] Khôi phục lại hàm fetchMajors gốc CỦA BẠN, vì nó xử lý đúng wrapper
export const fetchMajors = async (): Promise<Major[]> => {
    try {
        const response = await axiosInstance.get("api/university/majors")
        const body = response.data
        
        // Logic gốc của bạn là chính xác - API có trả về wrapper
        if (body && typeof body === "object" && "content" in body && Array.isArray(body.content)) {
            return body.content
        }
        if (Array.isArray(body)) return body
        if (body && typeof body === "object" && "data" in body && Array.isArray(body.data)) {
            return body.data
        }
        
        // Fallback an toàn
        return [] 
    } catch (error) {
        console.error("Error fetching majors:", error)
        throw error
    }
}

// (Các hàm còn lại giữ nguyên như cũ)
export const fetchMajorById = async (id: number): Promise<Major> => {
    try {
        const response = await axiosInstance.get(`api/university/majors/${id}`)
        const body: any = response.data
        console.log("fetchMajorById:", body)
        if (body && typeof body === "object" && "data" in body) {
            return body.data
        }
        return body
    } catch (error) {
        console.error(`Error fetching major ${id}:`, error)
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
        const response = await axiosInstance.put(`api/university/majors/${id}`, payload)
        const body: any = response.data
        if (body && typeof body === "object" && "data" in body) {
            return body.data
        }
        return body
    } catch (error) {
        console.error(`Error updating major ${id}:`, error)
        throw error
    }
}

export const deleteMajorById = async (id: number): Promise<any> => {
    try {
        const response = await axiosInstance.delete(`api/university/majors/${id}`)
        return response.data || { success: true, deleted: true }
    } catch (error) {
        console.error(`Error deleting major ${id}:`, error)
        throw error
    }
}